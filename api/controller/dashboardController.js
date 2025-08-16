import mongoose from "mongoose";
// Make sure to import your models
import Event from '../models/eventModel.js';
import TicketSales from '../models/ticketSalesModel.js';
import Payout from '../models/payoutModel.js';

/**
 * @desc Get aggregated dashboard summary for the authenticated organizer
 * @route GET /api/dashboard/summary
 * @access Private (Organizer)
 */
export const getOrganizerDashboardSummary = async (req, res) => {
    try {
        const organizerId = req.user.id; // Assuming req.user.id is the organizer's ID

        // 1. Total Events & Upcoming Events
        const events = await Event.find({ organizer: organizerId });
        const totalEvents = events.length;
        const now = new Date();
        const upcomingEvents = events.filter(event => new Date(event.startDate) > now).length;

        // 2. Total Tickets Sold & Total Revenue Made (FIXED AGGREGATION)
        const salesSummary = await TicketSales.aggregate([
            {
                $lookup: {
                    from: 'events', // The collection name for Event model (usually lowercase and plural)
                    localField: 'event', // Field from TicketSales
                    foreignField: '_id', // Field from Event
                    as: 'eventDetails'
                }
            },
            {
                $unwind: '$eventDetails' // Deconstructs the array field from the $lookup
            },
            {
                $match: {
                    'eventDetails.organizer': new mongoose.Types.ObjectId(organizerId), // Match by event's organizer
                    paymentStatus: 'Successful' // Only count successful purchases
                }
            },
            {
                $group: {
                    _id: null,
                    totalTicketsSold: { $sum: "$quantity" },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);
        const totalTicketsSold = salesSummary.length > 0 ? salesSummary[0].totalTicketsSold : 0;
        const totalRevenue = salesSummary.length > 0 ? salesSummary[0].totalRevenue : 0;

        // 3. Total Payout & Balance
        // This aggregation should be correct as Payout model directly stores organizerId
        const payoutSummary = await Payout.aggregate([
            { $match: { organizer: new mongoose.Types.ObjectId(organizerId), status: { $in: ['Completed', 'Processing'] } } },
            {
                $group: {
                    _id: null,
                    totalPaidOut: { $sum: "$amount" }
                }
            }
        ]);
        const totalPaidOut = payoutSummary.length > 0 ? payoutSummary[0].totalPaidOut : 0;

        const balance = totalRevenue - totalPaidOut;

        res.status(200).json({
            status: true,
            message: "Dashboard summary retrieved successfully.",
            data: {
                totalEvents,
                upcomingEvents,
                totalTicketsSold,
                totalRevenue,
                totalPaidOut,
                balance
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
    }
};