import TicketSales from "../models/ticketSalesModel.js";
import Event from '../models/eventModel.js';
import mongoose from 'mongoose';
import PlatformFee from "../models/platformFeeModel.js";
import { updateMonthlySummaryAfterSale } from "./monthlySummaryController.js";
import paystack from '../utils/paystackConfig.js'; // Assuming this is your Paystack service file
import dotenv from 'dotenv'; // Import dotenv
dotenv.config(); // Load environment variables from .env file

// Function to handle a new ticket sale and update the monthly summary
// This is the function you need to call from your router
export const processPaystackPayment = async (req, res) => {
  try {
    const { reference, eventId, ticketId, buyerDetails, quantity, unitPrice, totalAmount } = req.body;

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("Paystack secret key is not defined in environment variables.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Paystack secret key is missing.",
      });
    }

    // First, verify the payment with Paystack
    const paystackVerification = await paystack.transaction.verify(reference);
    
    if (paystackVerification.data.status === 'success') {
      const newSale = new TicketSales({
        event: eventId,
        ticket: ticketId,
        buyer: buyerDetails,
        quantity,
        unitPrice,
        totalAmount,
        paymentReference: reference,
        status: "Paid",
        paymentStatus: "Successful",
        paymentMethod: 'Card' // Assuming 'Card' for a Paystack transaction
      });

      await newSale.save();

      // IMPORTANT: After a successful sale, call the update function
      // This is the part that will increment your monthly summary data
      await updateMonthlySummaryAfterSale(newSale._id);

      res.status(200).json({
        success: true,
        message: "Ticket purchase successful and monthly summary updated.",
        data: newSale,
      });
    } else {
      // Payment failed or was not successful
      res.status(400).json({
        success: false,
        message: "Payment verification failed. Ticket sale not recorded.",
      });
    }
  } catch (error) {
    console.error("Error processing ticket sale with Paystack:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the ticket sale.",
      error: error.message,
    });
  }
};

export const getSalesSummary = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    // Get event with tickets
    const event = await Event.findById(eventId)
      .populate('tickets')
      .lean();
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // Get all successful ticket sales for this event
    const ticketSales = await TicketSales.find({
      event: eventId,
      paymentStatus: 'Successful'
    })
    .populate({
      path: 'ticket',
      select: 'ticketType price quantity'
    })
    .sort({ createdAt: -1 });

    // Create summary by ticket type
    const summary = event.tickets.map(ticket => {
      const salesForTicket = ticketSales.filter(sale => 
        sale.ticket && sale.ticket._id.toString() === ticket._id.toString()
      );
      
      const sold = salesForTicket.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      const available = Math.max((ticket.quantity || 0) - sold, 0);
      
      return {
        _id: ticket._id,
        ticketType: ticket.ticketType || 'General Admission',
        price: ticket.price || 0,
        quantity: ticket.quantity || 0,
        sold: sold,
        available: available,
        revenue: salesForTicket.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      };
    });

    // Format attendees data
    const formattedAttendees = ticketSales.map(sale => ({
      _id: sale._id,
      buyer: {
        fullName: sale.buyer?.fullName || 'Anonymous',
        email: sale.buyer?.email || 'no-email@example.com',
        phoneNumber: sale.buyer?.phoneNumber || ''
      },
      ticket: {
        _id: sale.ticket?._id || null,
        ticketType: sale.ticket?.ticketType || 'Unknown',
        price: sale.ticket?.price || 0
      },
      quantity: sale.quantity || 0,
      unitPrice: sale.unitPrice || 0,
      totalAmount: sale.totalAmount || 0,
      revenue: sale.revenue || 0, // Now includes the individual sale revenue
      platformFeeRate: sale.platformFeeRate || 0, // Now includes the platform fee rate
      feeType: sale.feeType || 'N/A', // Now includes the fee type
      paymentMethod: sale.paymentMethod || 'Unknown',
      paymentReference: sale.paymentReference || '',
      purchaseDate: sale.createdAt,
      checkInStatus: sale.checkInStatus || false,
      checkInTime: sale.checkInTime || null
    }));

    // Calculate totals
    const totals = {
      // Sum the totalAmount for gross sales
      totalSalesGross: ticketSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      // Sum the revenue field for platform revenue
      platformRevenue: ticketSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0),
      // Sum the tickets sold
      sales: ticketSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0),
      available: summary.reduce((sum, ticket) => sum + ticket.available, 0)
    };

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        eventName: event.eventName,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        tickets: event.tickets.map(t => ({
          _id: t._id,
          ticketType: t.ticketType,
          price: t.price,
          quantity: t.quantity
        }))
      },
      ticketSummary: summary,
      attendees: formattedAttendees,
      totals
    });

  } catch (error) {
    console.error("Error fetching sales summary:", {
      error: error.message,
      stack: error.stack,
      eventId
    });
    
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching sales summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getRegularGuests = async (req, res) => {
    try {
        const organizerId = req.user.id; // Assuming req.user.id is the authenticated organizer's ID

        // Find all events created by this organizer
        const organizerEvents = await Event.find({ organizer: organizerId }).select('_id');
        const eventIds = organizerEvents.map(event => event._id);

        if (eventIds.length === 0) {
            return res.status(200).json({
                status: true,
                message: "No events found for this organizer, so no regular guests.",
                data: []
            });
        }

        // Aggregate ticket sales to find unique buyers and count events attended
        const regularGuests = await TicketSales.aggregate([
            {
                $match: {
                    event: { $in: eventIds }, // Only include sales for this organizer's events
                    paymentStatus: 'Successful' // Only count successful purchases
                }
            },
            {
                $group: {
                    _id: "$buyer.email", // Group by buyer's email
                    fullName: { $first: "$buyer.fullName" }, // Get the first full name encountered
                    phoneNumber: { $first: "$buyer.phoneNumber" }, // Get the first phone number encountered
                    eventsAttendedCount: { $addToSet: "$event" } // Add unique event IDs to a set
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    email: "$_id",
                    fullName: 1,
                    phoneNumber: 1,
                    eventsAttendedCount: { $size: "$eventsAttendedCount" } // Count the size of the set
                }
            },
            {
                $sort: { eventsAttendedCount: -1 } // Sort by count of events attended (highest to lowest)
            }
        ]);

        res.status(200).json({
            status: true,
            message: "Regular guests retrieved successfully.",
            data: regularGuests
        });

    } catch (error) {
        console.error("Error fetching regular guests:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};

export const ticketsSoldToday = async (req, res) => {
  try {
    // 1. Define the date range for "today"
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // Set to midnight of the current day

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // Set to just before midnight of the next day

    // 2. Query the database for successful sales within the date range
    const successfulTicketsToday = await TicketSales.countDocuments({
      createdAt: {
        $gte: startOfToday, // Greater than or equal to the start of today
        $lt: endOfToday,   // Less than the start of the next day
      },
      paymentStatus: "Successful", // Only count successful payments
    });

    // 3. Send the count back in the response
    res.status(200).json({
      success: true,
      count: successfulTicketsToday,
    });
  } catch (error) {
    // 4. Handle any potential errors
    console.error("Error fetching today's ticket sales:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

export const ticketsSoldThisMonth = async (req, res) => {
  try {
    // 1. Get the current date
    const today = new Date();

    // 2. Calculate the start and end dates for the current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Sets date to the first day of the current month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Sets date to the last day of the current month

    // 3. Query the database for successful sales within this date range
    const successfulTicketsThisMonth = await TicketSales.countDocuments({
      createdAt: {
        $gte: startOfMonth, // Greater than or equal to the first day of the month
        $lt: new Date(endOfMonth.getTime() + 86400000), // Less than the first day of the next month
      },
      paymentStatus: "Successful", // Only count successful payments
    });

    // 4. Send the count back in the response
    res.status(200).json({
      success: true,
      count: successfulTicketsThisMonth,
    });
  } catch (error) {
    // 5. Handle any potential errors
    console.error("Error fetching this month's ticket sales:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

export const totalRevenueToday = async (req, res) => {
  try {
    // 1. Define the date range for "today"
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    // 2. Use the aggregation pipeline to sum the 'revenue' field
    const aggregationResult = await TicketSales.aggregate([{
      $match: {
        createdAt: {
          $gte: startOfToday,
          $lt: endOfToday,
        },
        paymentStatus: "Successful",
      },
    }, {
      $group: {
        _id: null, // Group all matching documents together
        totalRevenue: {
          $sum: "$revenue"
        }, // Sum the 'revenue' field directly
      },
    }, ]);

    // 3. Get the total revenue from the aggregation result
    let totalRevenue = 0;
    if (aggregationResult.length > 0) {
      totalRevenue = aggregationResult[0].totalRevenue;
    }

    // 4. Send the total revenue back in the response
    res.status(200).json({
      success: true,
      totalRevenue,
    });
  } catch (error) {
    // 5. Handle any potential errors
    console.error("Error fetching today's revenue:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

export const monthlyRevenue = async (req, res) => {
  try {
    // 1. Get the month and year from the request query or default to the current month/year
    const {
      month,
      year
    } = req.query;

    const today = new Date();
    const targetMonth = month ? parseInt(month) - 1 : today.getMonth(); // Convert to 0-indexed month
    const targetYear = year ? parseInt(year) : today.getFullYear();

    // 2. Define the start and end dates for the target month
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    // 3. Use the aggregation pipeline to sum the 'revenue' field for the month
    const aggregationResult = await TicketSales.aggregate([{
      $match: {
        createdAt: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        paymentStatus: "Successful",
      },
    }, {
      $group: {
        _id: null, // Group all matching documents together
        totalRevenue: {
          $sum: "$revenue"
        }, // Sum the 'revenue' field directly
      },
    }, ]);

    // 4. Get the total revenue from the aggregation result
    let totalRevenue = 0;
    if (aggregationResult.length > 0) {
      totalRevenue = aggregationResult[0].totalRevenue;
    }

    // 5. Send the total revenue back in the response
    res.status(200).json({
      success: true,
      totalRevenue,
      month: targetMonth + 1, // Send back the 1-indexed month
      year: targetYear
    });
  } catch (error) {
    // 6. Handle any potential errors
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

export const checkIn = async (req, res) => {
    try {
        console.log('Received check-in request with params:', req.params);
        console.log('Request body:', req.body);

        const { eventId } = req.params;
        const { email } = req.body;

        // 1. Validate that the necessary data is present.
        if (!eventId || !email) {
            return res.status(400).json({
                success: false,
                message: "Event ID and email are required for check-in."
            });
        }

        // 2. First, check if a ticket with this eventId and email exists at all.
        const existingTicket = await TicketSales.findOne({
            event: eventId,
            'buyer.email': email
        });

        // 3. If a ticket exists, check its status.
        if (existingTicket && existingTicket.checkInStatus) {
            // The ticket exists and has already been checked in.
            return res.status(409).json({ // 409 Conflict is a good status code here.
                success: false,
                message: "You've already checked-in."
            });
        }

        // 4. Now, attempt to find the ticket and check it in.
        // This query will only succeed if the ticket exists and is not checked in.
        const updatedTicket = await TicketSales.findOneAndUpdate(
            {
                event: eventId,
                'buyer.email': email,
                checkInStatus: false
            },
            {
                $set: {
                    checkInStatus: true,
                    checkInTime: new Date()
                }
            },
            { new: true }
        );

        // 5. Handle the case where no valid ticket was found to update.
        // This covers cases where the ticket didn't exist in the first place.
        if (!updatedTicket) {
            return res.status(404).json({
                success: false,
                message: "No valid ticket found for this email."
            });
        }

        // 6. Send a success response.
        res.status(200).json({
            success: true,
            message: "Ticket successfully checked in.",
            data: updatedTicket
        });

    } catch (error) {
        console.error("Error during check-in:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred during the check-in process.",
            error: error.message
        });
    }
};
