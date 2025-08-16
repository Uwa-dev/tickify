// controllers/payoutController.js
import mongoose from "mongoose";
import Payout from '../models/payoutModel.js';
import Event from '../models/eventModel.js';
import TicketSales from '../models/ticketSalesModel.js'; 
import PlatformFee from "../models/platformFeeModel.js";
// Import the new function from your monthly summary controller
import { updateMonthlySummaryAfterPayout } from './monthlySummaryController.js';


// Helper function to check if user is organizer
const checkOrganizerAuthorization = async (req, res, eventId) => {
    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404).json({ status: false, message: "Event not found." });
        return false;
    }
    const isOrganizer = event.organizer.toString() === req.user.id.toString();
    if (!isOrganizer) {
        res.status(403).json({ status: false, message: "Not authorized to manage payouts for this event. Only the event organizer can perform this action." });
        return false;
    }
    return event; // Return the event if authorized
};


export const requestPayout = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { amount, payoutMethod, notes } = req.body;

        if (!amount || !payoutMethod) {
            return res.status(400).json({ status: false, message: "Amount and Payout Method are required." });
        }
        if (amount <= 0) {
            return res.status(400).json({ status: false, message: "Payout amount must be positive." });
        }

        const event = await checkOrganizerAuthorization(req, res, eventId);
        if (!event) return;

        // Calculate total revenue from ticket sales for this event
        const totalRevenueResult = await TicketSales.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(eventId), paymentStatus: 'Successful' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // Calculate total already paid out for this event
        const totalPaidOutResult = await Payout.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(eventId), status: { $in: ['Completed', 'Processing'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalPaidOut = totalPaidOutResult.length > 0 ? totalPaidOutResult[0].total : 0;

        const availableBalance = totalRevenue - totalPaidOut;

        if (amount > availableBalance) {
            return res.status(400).json({ status: false, message: `Requested amount ₦${amount.toFixed(2)} exceeds available balance ₦${availableBalance.toFixed(2)}.` });
        }

        const newPayout = await Payout.create({
            event: eventId,
            organizer: req.user.id,
            amount,
            payoutMethod,
            notes,
            status: 'Pending', // Initial status
        });

        res.status(201).json({ status: true, message: "Payout request submitted successfully.", data: newPayout });

    } catch (error) {
        console.error("Error requesting payout:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};


export const getPayoutsForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await checkOrganizerAuthorization(req, res, eventId);
        if (!event) return;

        const payouts = await Payout.find({ event: eventId }).sort({ createdAt: -1 });

        res.status(200).json({ status: true, message: "Payouts retrieved successfully.", data: payouts });

    } catch (error) {
        console.error("Error fetching payouts:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};


export const getPayoutSummaryForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await checkOrganizerAuthorization(req, res, eventId);
        if (!event) return;

        // Calculate total revenue from ticket sales for this event
        const totalRevenueResult = await TicketSales.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(eventId), paymentStatus: 'Successful' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // Calculate total already paid out for this event
        const totalPaidOutResult = await Payout.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(eventId), status: { $in: ['Completed', 'Processing'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalPaidOut = totalPaidOutResult.length > 0 ? totalPaidOutResult[0].total : 0;

        const remainingBalance = totalRevenue - totalPaidOut;

        res.status(200).json({
            status: true,
            message: "Payout summary retrieved successfully.",
            data: {
                totalRevenue,
                totalPaidOut,
                remainingBalance,
                event // Include event details for convenience
            }
        });

    } catch (error) {
        console.error("Error fetching payout summary:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};

export const getTotalPayout = async (req, res) => {
  try {
    // Use countDocuments() to efficiently count all documents with a status of 'Pending'
    const pendingPayoutsCount = await Payout.countDocuments({
      status: 'Pending'
    });

    // Send a successful response with the count
    res.status(200).json({
      success: true,
      pendingPayoutsCount,
      message: `Successfully retrieved the count of pending payouts.`
    });
  } catch (error) {
    // Handle any server-side errors
    console.error("Error fetching total pending payouts:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message
    });
  }
};

// Add this new function to your existing payoutController.js
export const getAllPayoutsAdmin = async (req, res) => {
    try {

        const payouts = await Payout.find({})
            .populate('event', 'eventName')
            .populate('organizer', 'username')
            .sort({ createdAt: -1 });

        // Custom sort to bring 'Pending' payouts to the top
        payouts.sort((a, b) => {
            if (a.status === 'Pending' && b.status !== 'Pending') {
                return -1;
            }
            if (a.status !== 'Pending' && b.status === 'Pending') {
                return 1;
            }
            return 0;
        });

        res.status(200).json({ status: true, data: payouts });

    } catch (error) {
        console.error("Error fetching all payouts for admin:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};

export const getSinglePayoutAdmin = async (req, res) => {
  try {

    const { payoutId } = req.params;


    const payout = await Payout.findById(payoutId)
      .populate({
        path: 'organizer',
        // Corrected: Use 'firstName', 'lastName', 'middleName' to match database casing
        select: 'username accountDetails firstName lastName middleName',
      })
      .populate({
        path: 'event',
        select: 'eventName', // Select only the eventName
      });

    // If no payout is found, return a 404 Not Found response
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found.',
      });
    }

    // Return the found payout with a 200 OK status
    res.status(200).json({
      success: true,
      data: payout,
    });

  } catch (error) {
    console.error('Error fetching payout details:', error);
    // Handle invalid IDs (e.g., malformed ObjectId) and other server errors
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

export const completePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { isAdmin } = req.user;

    // Ensure only admins can access this endpoint
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized as an admin to complete payouts.' });
    }

    const payout = await Payout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found.' });
    }

    // Only allow completion if the current status is 'pending'
    if (payout.status.toLowerCase() !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot complete payout. Current status is '${payout.status}'. Only 'Pending' payouts can be completed.` });
    }

    payout.status = 'Completed';
    await payout.save();

    // ----------------------------------------------------
    // --- THIS IS THE KEY ADDITION ---
    // Call the function to update the monthly summaries
    await updateMonthlySummaryAfterPayout(payout._id);
    // ----------------------------------------------------

    res.status(200).json({
      success: true,
      message: 'Payout marked as completed successfully.',
      data: payout,
    });

  } catch (error) {
    console.error('Error completing payout:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// In your payoutController.js
// In your payoutController.js
export const cancelPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;

    console.log('Debug: Value of req.user:', req.user);

    // --- THE CRITICAL FIX IS HERE ---
    // Change _id to id, as that's what's present in req.user
    const { id: userId } = req.user || {}; // Use 'id' instead of '_id'

    console.log('Debug: Extracted userId:', userId);

    if (!userId) {
      console.error('Error: User ID is missing from request. Authentication middleware might not be working correctly.');
      return res.status(401).json({ success: false, message: 'Authentication required: User ID not found.' });
    }

    // Populate the 'organizer' field to get the full organizer object
    const payout = await Payout.findById(payoutId).populate('organizer');

    if (!payout) {
      console.log(`Payout with ID ${payoutId} not found.`);
      return res.status(404).json({ success: false, message: 'Payout not found.' });
    }

    console.log(`Debug: Payout found. Payout ID: ${payout._id}`);
    console.log(`Debug: Value of payout.organizer:`, payout.organizer);

    if (!payout.organizer) {
      console.log(`Debug: payout.organizer is null or undefined for payout ID: ${payout._id}. This means the linked organizer document might be missing.`);
      return res.status(404).json({ success: false, message: 'Organizer details not found for this payout. Data might be inconsistent.' });
    }

    // Now both payout.organizer._id and userId should be defined
    if (payout.organizer._id.toString() !== userId.toString()) {
      console.log(`Debug: Authorization failed. User ID: ${userId}, Payout Organizer ID: ${payout.organizer._id}`);
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this payout.' });
    }

    if (payout.status.toLowerCase() !== 'pending') {
      console.log(`Debug: Cannot cancel payout. Current status is '${payout.status}' for payout ID: ${payout._id}.`);
      return res.status(400).json({ success: false, message: `Cannot cancel payout. Current status is '${payout.status}'. Only 'Pending' payouts can be cancelled.` });
    }

    payout.status = 'Cancelled';
    await payout.save();

    console.log(`Debug: Payout ${payout._id} successfully cancelled.`);
    res.status(200).json({
      success: true,
      message: 'Payout cancelled successfully. ❌',
      data: payout,
    });

  } catch (error) {
    console.error('Error cancelling payout:', error);
    console.error('Full error object:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getOrganizerMetrics = async (req, res) => {
  try {
    const { id: organizerId } = req.params;

    if (!organizerId) {
      return res.status(400).json({ error: "Organizer ID is required." });
    }

    // 1. Find all events associated with this organizer, and sort them by date in descending order
    const events = await Event.find({ organizer: organizerId }).sort({ eventDate: -1 });
    const eventIds = events.map(event => event._id);

    // Initialize all metrics
    let totalSales = 0; // This represents the gross revenue from all sales
    let totalTicketCount = 0; // This represents the number of tickets sold
    let totalRevenue = 0; // This will now represent the admin's revenue (the platform fee)
    let latestEventName = null;

    // Set the latest event name from the first event in the sorted list
    if (events && events.length > 0) {
      latestEventName = events[0].eventName;

    }

    // 2. Find all successful ticket sales for these events
    const successfulSales = await TicketSales.find({
      event: { $in: eventIds }, // Use the array of event IDs
      paymentStatus: 'Successful',
      status: 'Paid'
    });

    // 3. Calculate metrics from the successful sales
    if (successfulSales && successfulSales.length > 0) {
      successfulSales.forEach(sale => {
        // totalSales should be the total amount of money collected (gross revenue)
        totalSales += sale.totalAmount || 0;
        
        // totalTicketCount is the number of tickets sold
        totalTicketCount += sale.quantity || 0;
      });
    }
    
    // 4. Get the platform fee percentage from the database
    const platformFeeDoc = await PlatformFee.findOne();
    const feePercentage = platformFeeDoc ? platformFeeDoc.feePercentage / 100 : 0.03; // Default to 3%

    // 5. Calculate the net revenue after deducting the platform fee
    const feeAmount = totalSales * feePercentage;
    
    // This is the key change: totalRevenue now equals the fee amount
    totalRevenue = feeAmount;

    // Construct the final metrics object to be sent as a response
    const metrics = {
      totalEvents: events.length,
      totalSales, // Gross revenue from all sales
      totalRevenue, // Admin's revenue (the platform fee)
      totalTicketCount, // The actual number of tickets sold
      latestEventName,
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error("Error fetching organizer metrics:", error);
    res.status(500).json({ error: "Error fetching organizer metrics: " + error.message });
  }
};
