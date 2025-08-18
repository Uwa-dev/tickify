import { v4 as uuidv4 } from "uuid";
import Ticket from "../models/ticketModel.js";
import Event from "../models/eventModel.js";
import mongoose from 'mongoose';
import TicketSales from '../models/ticketSalesModel.js';
import PromoCode from "../models/promoCodeModel.js";
import PlatformFee from "../models/platformFeeModel.js";


const generateUniqueCode = () => uuidv4();

export const createTicket = async (req, res) => {
  try {
    const { eventId, ticketType, price, quantity, transferFee } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch the current platform fee percentage from the database
    // Assuming there is only one PlatformFee document.
    const platformFeeDoc = await PlatformFee.findOne({});
    const platformFeePercentage = platformFeeDoc ? platformFeeDoc.feePercentage / 100 : 0.03; // Default to 3% if not found

    let finalPrice;
    let serviceFee;

    // Calculate the service fee amount
    serviceFee = parseFloat(price) * platformFeePercentage;
    
    if (transferFee) {
      // Fee is passed to the customer (guest)
      finalPrice = parseFloat(price) + serviceFee;
    } else {
      // Fee is taken from the ticket price (organizer)
      finalPrice = parseFloat(price); // The customer still pays the base price
    }
    
    // Ensure both are rounded to two decimal places
    finalPrice = parseFloat(finalPrice.toFixed(2));
    serviceFee = parseFloat(serviceFee.toFixed(2));

    const uniqueCode = generateUniqueCode();

    const newTicket = new Ticket({
      event: eventId,
      ticketType,
      price,
      quantity: quantity === 'Unlimited' ? Number.MAX_SAFE_INTEGER : quantity,
      uniqueCode,
      finalPrice,   // New calculated field
      serviceFee,   // New field for financial records
      transferFee,  // Save the boolean value for record-keeping
    });

    await newTicket.save();

    // Add ticket to the event
    if (!Array.isArray(event.tickets)) event.tickets = [];
    event.tickets.push(newTicket._id);
    await event.save();

    res.status(201).json({ message: "Ticket created successfully", ticket: newTicket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Error creating ticket: " + error.message });
  }
};

export const getTicketsOfAnEvent = async(req, res) => {
  try {
    const { eventId } = req.params; // Assuming eventId comes from URL parameters

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Event ID provided"
      });
    }

    // Find all tickets associated with the given eventId
    const tickets = await Ticket.find({ event: eventId });

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No tickets found for this event"
      });
    }

    res.status(200).json({
      status: true,
      message: "Tickets retrieved successfully",
      data: { tickets }
    });

  } catch (error) {
    console.error("Error fetching tickets for event:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params; // Assuming ticketId comes from URL parameters

    // Validate ticketId
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Ticket ID provided"
      });
    }

    // Find the ticket by ID
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Ticket retrieved successfully",
      data: ticket // Return the ticket data directly
    });

  } catch (error) {
    console.error("Error fetching ticket by ID:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // 1. Validate ticketId
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Ticket ID provided"
      });
    }

    // 2. Find the ticket to ensure it exists and get its eventId for authorization
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found"
      });
    }

    // 3. Authorization Check: Ensure the user is the organizer of the event
    // or an admin. (Assuming req.user is populated by your authentication middleware)
    const event = await Event.findById(ticket.event); // Get the associated event
    if (!event) {
        return res.status(404).json({
            status: false,
            message: "Associated event not found for this ticket"
        });
    }

    const isOrganizer = event.organizer.toString() === req.user.id.toString();
    const isAdmin = req.user.isAdmin === true;

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        status: false,
        message: "Not authorized to delete this ticket"
      });
    }

    const soldTicketsCount = await TicketSales.countDocuments({ ticket: ticketId, paymentStatus: 'Successful' });
    if (soldTicketsCount > 0) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete ticket: tickets have already been sold for this type. Consider archiving instead."
      });
    }

    // 4. Delete the ticket
    await Ticket.findByIdAndDelete(ticketId);

    res.status(200).json({
      status: true,
      message: "Ticket deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;
    const updates = req.body;

    // --- Start of Detailed Validation ---
    const errors = [];

    if (!updates.ticketType) {
      errors.push("Ticket Type is required.");
    }
    if (updates.price === undefined || updates.price === null || isNaN(parseFloat(updates.price))) {
      errors.push("Price is required and must be a number.");
    }
    // Check quantity only if not unlimited
    if (!updates.unlimited) {
      const parsedQuantity = parseInt(updates.quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        errors.push("Quantity must be a positive number for non-unlimited tickets.");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors // Return specific errors
      });
    }
    // --- End of Detailed Validation ---

    // Find the event first to verify ownership/association
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ status: false, message: "Event not found" });
    }

    // Check if ticket exists and belongs to this event
    const ticket = await Ticket.findOne({ _id: ticketId, event: eventId });
    if (!ticket) {
      return res.status(404).json({ status: false, message: "Ticket not found for this event" });
    }

    // Additional check if tickets have already been sold
    // Assuming 'soldQuantity' is a field on your Ticket model
    if (ticket.soldQuantity && ticket.soldQuantity > 0) {
      // Prevent certain changes if tickets are already sold
      if (ticket.price !== updates.price) {
        return res.status(400).json({
          status: false,
          message: "Cannot change price after tickets have been sold"
        });
      }

      // If quantity is being updated and it's not unlimited, check against soldQuantity
      if (!updates.unlimited && updates.quantity < ticket.soldQuantity) {
        return res.status(400).json({
          status: false,
          message: `New quantity cannot be less than already sold tickets (${ticket.soldQuantity})`
        });
      }
    }
    
    // --- START OF NEW LOGIC: Calculate finalPrice based on updates ---
    const originalPrice = parseFloat(updates.price);
    let finalPrice;
    
    if (updates.transferFee) {
        // Fetch the platform fee percentage from the database
        const platformFeeDoc = await PlatformFee.findOne({});
        const feePercentage = platformFeeDoc ? platformFeeDoc.feePercentage : 3; // Default to 3% if not found
        
        // Calculate the buyer's final price
        // Formula: finalPrice = price / (1 - feePercentage / 100)
        finalPrice = originalPrice / (1 - feePercentage / 100);
    } else {
        finalPrice = originalPrice;
    }
    
    // --- END OF NEW LOGIC ---

    // Update ticket fields with the new values
    ticket.ticketType = updates.ticketType;
    ticket.price = originalPrice;
    ticket.finalPrice = finalPrice; // SET THE CALCULATED finalPrice
    ticket.quantity = updates.unlimited ? Number.MAX_SAFE_INTEGER : parseInt(updates.quantity);
    ticket.transferFee = updates.transferFee || false;

    // Save the updated ticket
    const updatedTicket = await ticket.save();

    res.status(200).json({
      status: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    // If it's a Mongoose validation error (e.g., from schema 'required' or 'enum')
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: false,
            message: "Ticket validation failed: " + error.message,
            errors: Object.values(error.errors).map(err => err.message) // Extract Mongoose specific error messages
        });
    }
    res.status(500).json({ status: false, message: "Failed to update ticket", error: error.message });
  }
};

const checkAuthorization = async (req, res, eventId) => {
    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404).json({ status: false, message: "Event not found." });
        return false;
    }
    const isOrganizer = event.organizer.toString() === req.user.id.toString();
    // Removed isAdmin check as only organizers should manage promo codes
    if (!isOrganizer) {
        res.status(403).json({ status: false, message: "Not authorized to manage promo codes for this event. Only the event organizer can perform this action." });
        return false;
    }
    return event; // Return the event if authorized
};

export const createPromoCode = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { code, discountType, value, usageLimit, expiryDate, appliesToTickets } = req.body;

        // Authorization check
        const event = await checkAuthorization(req, res, eventId);
        if (!event) return; // Response already sent by checkAuthorization

        // Basic validation
        if (!code || !discountType || value === undefined || !expiryDate) {
            return res.status(400).json({ status: false, message: "Please provide all required promo code fields." });
        }
        if (discountType === 'percentage' && (value < 0 || value > 100)) {
            return res.status(400).json({ status: false, message: "Percentage discount must be between 0 and 100." });
        }
        if (discountType === 'fixed' && value <= 0) {
            return res.status(400).json({ status: false, message: "Fixed discount must be greater than 0." });
        }
        if (usageLimit !== undefined && usageLimit < 0) {
            return res.status(400).json({ status: false, message: "Usage limit cannot be negative." });
        }

        // Check for existing promo code with the same code for this event
        const existingPromoCode = await PromoCode.findOne({ event: eventId, code: code.toUpperCase() });
        if (existingPromoCode) {
            return res.status(400).json({ status: false, message: `Promo code '${code}' already exists for this event.` });
        }

        const newPromoCode = await PromoCode.create({
            event: eventId,
            code: code.toUpperCase(),
            discountType,
            value: parseFloat(value),
            usageLimit: usageLimit !== '' ? parseInt(usageLimit) : 0, // 0 for unlimited
            expiryDate: new Date(expiryDate),
            appliesToTickets: appliesToTickets || [], // Ensure it's an array
            organizer: req.user.id, // Store the creator's ID
            status: 'Active' // Default status
        });

        res.status(201).json({ status: true, message: "Promo code created successfully.", data: newPromoCode });

    } catch (error) {
        console.error("Error creating promo code:", error);
        // Handle Mongoose duplicate key error specifically for the compound index
        if (error.code === 11000 && error.keyPattern && error.keyPattern.event === 1 && error.keyPattern.code === 1) {
            return res.status(400).json({ status: false, message: "A promo code with this name already exists for this event." });
        }
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};

export const getPromoCodesForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Authorization check
        const event = await checkAuthorization(req, res, eventId);
        if (!event) return;

        // Find all promo codes for the event, populate ticket details if needed
        const promoCodes = await PromoCode.find({ event: eventId })
                                            .populate('appliesToTickets', 'ticketType') // Populate ticketType from Ticket model
                                            .sort({ createdAt: -1 }); // Sort by newest first

        // Update status to 'Expired' for any codes past their expiryDate if not already set
        const now = new Date();
        for (const promo of promoCodes) {
            if (promo.expiryDate < now && promo.status !== 'Expired') {
                promo.status = 'Expired';
                await promo.save();
            }
        }

        res.status(200).json({ status: true, message: "Promo codes retrieved successfully.", data: promoCodes });

    } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};


export const updatePromoCodeStatus = async (req, res) => {
    try {
        const { promoCodeId } = req.params;
        const { status } = req.body; // Expected status: 'Active' or 'Closed'

        if (!mongoose.Types.ObjectId.isValid(promoCodeId)) {
            return res.status(400).json({ status: false, message: "Invalid Promo Code ID." });
        }
        // Ensure the target status is valid for manual setting
        if (!['Active', 'Closed'].includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid status provided. Must be 'Active' or 'Closed'." });
        }

        const promoCode = await PromoCode.findById(promoCodeId);
        if (!promoCode) {
            return res.status(404).json({ status: false, message: "Promo code not found." });
        }

        // Authorization check (ensure user manages the event this promo code belongs to)
        const event = await checkAuthorization(req, res, promoCode.event); // event is fetched here
        if (!event) return;

        // Get current date for comparison
        const now = new Date();
        // Check if the event has already taken place
        const eventHasTakenPlace = new Date(event.startDate) <= now; // Assuming event.startDate is the relevant field

        // Logic for status changes based on current status and event date
        if (promoCode.status === 'Expired') {
            // If promo code is Expired, only allow changing to 'Active' if event has NOT taken place
            if (eventHasTakenPlace) {
                return res.status(400).json({ status: false, message: "Cannot reactivate an expired promo code for an event that has already taken place." });
            }
            if (status !== 'Active') {
                return res.status(400).json({ status: false, message: "Expired promo code can only be reactivated to 'Active' status if the event has not taken place." });
            }
        } else if (promoCode.status === 'Active' && status === 'Active') {
            return res.status(400).json({ status: false, message: "Promo code is already Active." });
        } else if (promoCode.status === 'Closed' && status === 'Closed') {
            return res.status(400).json({ status: false, message: "Promo code is already Closed." });
        }

        promoCode.status = status;
        await promoCode.save();

        res.status(200).json({ status: true, message: "Promo code status updated successfully.", data: promoCode });

    } catch (error) {
        console.error("Error updating promo code status:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};


export const deletePromoCode = async (req, res) => {
    try {
        const { promoCodeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(promoCodeId)) {
            return res.status(400).json({ status: false, message: "Invalid Promo Code ID." });
        }

        const promoCode = await PromoCode.findById(promoCodeId);
        if (!promoCode) {
            return res.status(404).json({ status: false, message: "Promo code not found." });
        }

        // Authorization check
        const event = await checkAuthorization(req, res, promoCode.event);
        if (!event) return;


        if (promoCode.timesUsed > 0) {
            return res.status(400).json({ status: false, message: "Cannot delete promo code that has been used. Consider closing it instead." });
        }

        await PromoCode.findByIdAndDelete(promoCodeId);

        res.status(200).json({ status: true, message: "Promo code deleted successfully." });

    } catch (error) {
        console.error("Error deleting promo code:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};

export const validatePromoCode = async (req, res) => {
    try {
        console.log("Promo Code Validation hit!", req.body);
        
        // This line is now safe, as we check for req.body first
        if (!req.body) {
            return res.status(400).json({ status: false, message: "Missing request body." });
        }

        const { eventId, code, ticketIds } = req.body;

        if (!eventId || !code || !ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({ status: false, message: "Missing required fields: eventId, code, or ticketIds." });
        }
        
        // 1. Find the promo code and validate against the event
        const promoCodeDetails = await PromoCode.findOne({
            event: eventId,
            code: code.toUpperCase(),
            status: 'Active',
            expiryDate: { $gt: new Date() },
        });

        if (!promoCodeDetails) {
            return res.status(404).json({ status: false, message: "Invalid promo code." });
        }
        
        // 2. Check usage limit
        if (promoCodeDetails.usageLimit > 0 && promoCodeDetails.timesUsed >= promoCodeDetails.usageLimit) {
            return res.status(400).json({ status: false, message: "This promo code has reached its usage limit." });
        }

        // 3. Check if the promo code applies to the selected ticket(s)
        if (promoCodeDetails.appliesToTickets.length > 0) {
            const allTicketsApplicable = ticketIds.every(ticketId => 
                promoCodeDetails.appliesToTickets.includes(ticketId)
            );
            if (!allTicketsApplicable) {
                return res.status(400).json({ status: false, message: "This promo code does not apply to all selected tickets." });
            }
        }
        
        // 4. If all checks pass, return the promo code details
        return res.status(200).json({
            status: true,
            message: "Promo code is valid.",
            promoCode: {
                code: promoCodeDetails.code,
                discountType: promoCodeDetails.discountType,
                value: promoCodeDetails.value,
            }
        });

    } catch (error) {
        console.error("Error validating promo code:", error);
        res.status(500).json({ status: false, message: "Internal server error." });
    }
};
