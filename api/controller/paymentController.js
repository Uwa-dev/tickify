import Payment from '../models/paymentModel.js';
import TicketSales from '../models/ticketSalesModel.js';
import Event from '../models/eventModel.js';
import Ticket from '../models/ticketModel.js';
import paystack from '../utils/paystackConfig.js';
import PromoCode from "../models/promoCodeModel.js";
import PlatformFee from '../models/platformFeeModel.js';

export const initializePayment = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      amount: sentAmount,
      eventId, 
      ticketId,
      quantity,
      customTicketUrl,
      promoCode
    } = req.body;

    // 1. Validate required fields
    if (!fullName || !email || !phoneNumber || !sentAmount || !eventId || !ticketId || !quantity || !customTicketUrl) {
      return res.status(400).json({ 
        status: false, 
        message: "Missing required fields" 
      });
    }

    // 2. Fetch ticket details from the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ 
        status: false, 
        message: "Ticket not found" 
      });
    }

    // 3. Begin server-side price calculation
    let finalAmount = ticket.price * quantity;

    // 4. Validate and apply promo code
    let promoCodeDetails = null;
    if (promoCode) {
      promoCodeDetails = await PromoCode.findOne({
        event: eventId,
        code: promoCode.toUpperCase(),
        status: 'Active',
        expiryDate: { $gt: new Date() },
      });

      if (!promoCodeDetails) {
        return res.status(400).json({ 
          status: false, 
          message: "Invalid promo code." 
        });
      }

      // Check usage limit
      if (promoCodeDetails.usageLimit > 0 && promoCodeDetails.timesUsed >= promoCodeDetails.usageLimit) {
        return res.status(400).json({ 
          status: false, 
          message: "This promo code has reached its usage limit." 
        });
      }
      
      // Apply the discount
      if (promoCodeDetails.discountType === 'percentage') {
        finalAmount -= finalAmount * (promoCodeDetails.value / 100);
      } else if (promoCodeDetails.discountType === 'fixed') {
        finalAmount -= promoCodeDetails.value;
      }
    }

    // 5. Calculate and apply platform fee
    // Always fetch the platform fee rate first
    const platformFeeDoc = await PlatformFee.findOne({});
    const platformFeeRate = platformFeeDoc ? platformFeeDoc.feePercentage : 3;

    let revenueAmount = 0;
    let feeType;

    // Determine the fee type and calculate the final amount
    if (ticket.transferFee) {
      // Fee is added to the customer's total
      revenueAmount = finalAmount * (platformFeeRate / 100);
      finalAmount += revenueAmount;
      feeType = 'added';
    } else {
      // Fee is subtracted from the organizer's total (no change to finalAmount)
      revenueAmount = finalAmount * (platformFeeRate / 100);
      feeType = 'subtracted';
    }
    
    // Ensure final amount is not negative
    finalAmount = Math.max(0, finalAmount);
    
    // --- FIX: Round the final amount to two decimal places ---
    const roundedFinalAmount = parseFloat(finalAmount.toFixed(2));
    
    // 6. Security check: Compare the rounded backend amount with the frontend amount
    // The strict comparison now works because both numbers are rounded.
    if (roundedFinalAmount !== sentAmount) {
      return res.status(400).json({
        status: false,
        message: `Price mismatch. Calculated: ${roundedFinalAmount}, Sent: ${sentAmount}. Please try again.`,
      });
    }

    // 7. Generate unique reference
    const reference = `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // 8. Create payment record
    const newPayment = new Payment({
      fullName,
      email,
      amount: roundedFinalAmount,
      phoneNumber,
      reference,
      status: "pending",
      metadata: {
        eventId,
        ticketId,
        quantity,
        customTicketUrl,
        promoCode: promoCodeDetails ? promoCodeDetails.code : null,
        platformFeeCharged: revenueAmount, 
        transferFeeToGuest: ticket.transferFee,
      },
    });
    await newPayment.save();

    // 9. Increment promo code usage if applicable
    if (promoCodeDetails) {
      promoCodeDetails.timesUsed += 1;
      await promoCodeDetails.save();
    }

    // 10. Initialize Paystack payment
    const paystackResponse = await paystack.transaction.initialize({
      amount: roundedFinalAmount * 100, // Convert to kobo
      email,
      reference,
      metadata: {
        paymentId: newPayment._id,
        eventId,
        ticketId,
        customerName: fullName,
        phoneNumber,
        quantity,
        customTicketUrl,
        promoCode: promoCode,
        // Include the fee details in the metadata for verification
        platformFeeRate: platformFeeRate,
        feeType: feeType,
        revenue: revenueAmount,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}&customUrl=${customTicketUrl}` 
    });

    res.status(200).json({
      status: true,
      message: "Payment initialized successfully",
      data: {
        authorizationUrl: paystackResponse.data.authorization_url,
        payment: newPayment
      }
    });

  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ 
      status: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        status: false,
        message: "Reference parameter is required"
      });
    }

    // Verify payment with Paystack
    const verification = await paystack.transaction.verify({ reference });

    if (!verification.data || verification.data.status !== 'success') {
      return res.status(400).json({
        status: false,
        message: "Payment verification failed",
        data: verification.data
      });
    }

    const metadata = verification.data.metadata || {};
    const paymentMethod = verification.data.channel || verification.data.authorization?.channel || 'Unknown';
    const formattedPaymentMethod = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
    const buyerFullName = metadata.customerName || 'Anonymous';
    const buyerPhoneNumber = verification.data.customer?.phone || metadata.phoneNumber || 'N/A';
    
    // Get the required fields from metadata
    const platformFeeRate = metadata.platformFeeRate;
    const feeType = metadata.feeType;
    const revenue = metadata.revenue;
    const totalAmount = verification.data.amount / 100;

    let ticketSaleRecord;
    try {
      // Attempt to create the TicketSales record with the new required fields
      ticketSaleRecord = await TicketSales.create({
        event: metadata.eventId,
        ticket: metadata.ticketId,
        buyer: {
          fullName: buyerFullName,
          email: verification.data.customer?.email || metadata.email,
          phoneNumber: buyerPhoneNumber
        },
        quantity: metadata.quantity || 1,
        unitPrice: verification.data.amount / 100, // This might not be unit price if quantity > 1
        totalAmount: totalAmount,
        revenue: revenue, // Pass the calculated revenue
        platformFeeRate: platformFeeRate, // Pass the fee rate
        feeType: feeType, // Pass the fee type
        paymentReference: reference,
        paymentStatus: 'Successful',
        paymentMethod: formattedPaymentMethod,
        status: 'Paid',
        checkInStatus: false
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern && error.keyPattern.paymentReference === 1) {
        console.warn(`Duplicate key error for paymentReference: ${reference}. Attempting to retrieve existing record.`);
        ticketSaleRecord = await TicketSales.findOne({ paymentReference: reference });
        if (!ticketSaleRecord) {
          console.error(`Failed to find existing ticket sale record for ${reference} after duplicate key error.`);
          return res.status(500).json({
            status: false,
            message: "Internal server error: Could not retrieve existing ticket sale record.",
            error: error.message
          });
        }
        if (ticketSaleRecord.status !== 'Paid' || ticketSaleRecord.paymentStatus !== 'Successful') {
            ticketSaleRecord.status = 'Paid';
            ticketSaleRecord.paymentStatus = 'Successful';
            ticketSaleRecord.paymentMethod = formattedPaymentMethod;
            ticketSaleRecord.totalAmount = totalAmount;
            ticketSaleRecord.revenue = revenue;
            ticketSaleRecord.platformFeeRate = platformFeeRate;
            ticketSaleRecord.feeType = feeType;
            ticketSaleRecord.buyer.fullName = buyerFullName;
            ticketSaleRecord.buyer.email = verification.data.customer?.email || metadata.email;
            ticketSaleRecord.buyer.phoneNumber = buyerPhoneNumber;
            await ticketSaleRecord.save();
        }
      } else {
        throw error;
      }
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { reference },
      { status: 'successful', updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPayment) {
      console.warn(`Payment record for reference ${reference} not found during update.`);
    }

    return res.status(200).json({
      status: true,
      message: "Payment verified and ticket issued successfully",
      data: {
        payment: updatedPayment,
        ticketSale: ticketSaleRecord,
        customUrl: metadata.customTicketUrl,
        verification: verification.data
      }
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: false,
            message: "TicketSales validation failed: " + error.message,
            errors: error.errors
        });
    }
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ 
        status: false, 
        message: "Payment not found" 
      });
    }

    let ticketSale = null;
    if (payment.status === 'success') {
      ticketSale = await TicketSales.findOne({ paymentReference: reference })
        .populate('event ticket');
    }

    res.status(200).json({
      status: true,
      data: {
        payment,
        ticketSale
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const getEventTicketSales = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.user;

    const event = await Event.findOne({
      _id: eventId,
      organizer: userId
    });

    if (!event) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized or event not found"
      });
    }

    const ticketSales = await TicketSales.find({ event: eventId })
      .populate('ticket')
      .sort({ createdAt: -1 });

    const totalSales = ticketSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = ticketSales.reduce((sum, sale) => sum + sale.quantity, 0);

    res.status(200).json({
      status: true,
      data: {
        event: {
          name: event.eventName,
          date: event.startDate
        },
        summary: {
          totalSales,
          totalTickets,
          totalEvents: 1
        },
        ticketSales
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getAllActiveEventTicketSales = async (req, res) => {
  try {
    const activeEvents = await Event.find({ status: 'active' })
      .select('_id eventName startDate organizer');

    const ticketSales = await TicketSales.find({
      event: { $in: activeEvents.map(e => e._id) }
    })
      .populate('event ticket')
      .sort({ createdAt: -1 });

    const totalSales = ticketSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = ticketSales.reduce((sum, sale) => sum + sale.quantity, 0);

    const salesByEvent = activeEvents.map(event => {
      const eventSales = ticketSales.filter(sale => sale.event._id.equals(event._id));
      const eventTotal = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const eventTickets = eventSales.reduce((sum, sale) => sum + sale.quantity, 0);

      return {
        eventId: event._id,
        eventName: event.eventName,
        startDate: event.startDate,
        totalSales: eventTotal,
        totalTickets: eventTickets,
        salesCount: eventSales.length
      };
    });

    res.status(200).json({
      status: true,
      data: {
        summary: {
          totalSales,
          totalTickets,
          totalEvents: activeEvents.length
        },
        salesByEvent,
        detailedSales: ticketSales
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getSalesAnalytics = async (req, res) => {
  try {
    const salesByMonth = await TicketSales.aggregate([
      {
        $match: {
          paymentStatus: 'Successful'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalSales: { $sum: "$totalAmount" },
          ticketCount: { $sum: "$quantity" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const topEvents = await TicketSales.aggregate([
      {
        $match: {
          paymentStatus: 'Successful'
        }
      },
      {
        $group: {
          _id: "$event",
          totalSales: { $sum: "$totalAmount" },
          ticketCount: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" }
    ]);

    res.status(200).json({
      status: true,
      data: {
        salesByMonth,
        topEvents
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
};