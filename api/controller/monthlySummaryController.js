import mongoose from 'mongoose';
import MonthlySummary from '../models/monthlySummaryModel.js';
import TicketSales from '../models/ticketSalesModel.js';
import Payout from '../models/payoutModel.js';

// This function is called when a successful ticket sale occurs.
// It now updates the monthly summary.
export const updateMonthlySummaryAfterSale = async (ticketSaleId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketSaleId)) {
    console.error('Invalid ticketSaleId provided.');
    return;
  }
  try {
    const sale = await TicketSales.findById(ticketSaleId);
    if (!sale || sale.paymentStatus !== 'Successful') {
      console.warn('Ticket sale not found or not successful.');
      return;
    }

    const saleMonth = sale.createdAt.toISOString().slice(0, 7); // e.g., '2024-05'
    
    console.log(`[updateMonthlySummaryAfterSale] Processing sale for month: ${saleMonth}, quantity: ${sale.quantity}, amount: ${sale.totalAmount}`);

    // Atomically update the summary document using findOneAndUpdate with $inc
    await MonthlySummary.findOneAndUpdate(
      { month: saleMonth },
      {
        $inc: {
          totalTicketsSold: sale.quantity,
          totalTicketAmount: sale.totalAmount,
          // Use the 'revenue' field directly from the sale document
          totalRevenue: sale.revenue, 
          // Balance is the amount due to the organizer (Total - Revenue)
          balance: sale.totalAmount - sale.revenue,
        },
      },
      { upsert: true, new: true } // upsert creates a new doc if none exists
    );
    
    console.log(`[updateMonthlySummaryAfterSale] Monthly summary for ${saleMonth} updated successfully after sale.`);
  } catch (error) {
    console.error("Error updating monthly summary after ticket sale:", error);
  }
};


// This function is called after a payout is completed
// It updates the monthly summaries by deducting the payout amount.
export const updateMonthlySummaryAfterPayout = async (payoutId) => {
  if (!mongoose.Types.ObjectId.isValid(payoutId)) {
    console.error('Invalid payoutId provided.');
    return;
  }
  try {
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      console.warn('Payout not found.');
      return;
    }
    
    // Get the month from the payout's creation date
    const payoutMonth = payout.createdAt.toISOString().slice(0, 7); // e.g., '2024-05'
    
    console.log(`[updateMonthlySummaryAfterPayout] Processing payout for ID: ${payoutId} for month: ${payoutMonth}, amount: ${payout.amount}`);
    
    // Atomically update the summary with payouts and new balance
    // This is a direct update to the correct monthly summary document
    await MonthlySummary.findOneAndUpdate(
      { month: payoutMonth },
      {
        $inc: {
          totalPayouts: payout.amount,
          balance: -payout.amount,
        },
      },
      { upsert: true, new: true } // upsert creates a new doc if none exists
    );
    
    console.log(`[updateMonthlySummaryAfterPayout] Monthly summary for ${payoutMonth} updated successfully after payout.`);
  } catch (error) {
    console.error("Error updating monthly summary after payout:", error);
  }
};


// --- This is the new, more robust function to recalculate all monthly summaries from existing data ---
export const recalculateMonthlySummaries = async (req, res) => {
  try {
    console.log('[recalculateMonthlySummaries] Starting full recalculation process...');
    
    // Step 1: Delete all existing monthly summaries to start fresh
    await MonthlySummary.deleteMany({});
    console.log('[recalculateMonthlySummaries] All existing monthly summaries deleted.');
    
    // Step 2: Aggregate sales and payouts separately to ensure correct final calculations
    // First, aggregate all successful sales data by month
    const salesAggregatedByMonth = await TicketSales.aggregate([
      { $match: { paymentStatus: 'Successful' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalTicketsSold: { $sum: "$quantity" },
          totalTicketAmount: { $sum: "$totalAmount" },
          totalRevenue: { $sum: "$revenue" } // Use the revenue field directly
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Second, aggregate all completed payouts by the month they were created
    const payoutsAggregatedByMonth = await Payout.aggregate([
      { $match: { status: 'Completed' } }, // Only consider completed payouts
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalPayouts: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('[recalculateMonthlySummaries] Sales aggregation results:', JSON.stringify(salesAggregatedByMonth, null, 2));
    console.log('[recalculateMonthlySummaries] Payouts aggregation results:', JSON.stringify(payoutsAggregatedByMonth, null, 2));

    // Combine the aggregated data into a single map for easier processing
    const monthlyDataMap = {};

    // Process sales first
    salesAggregatedByMonth.forEach(item => {
      monthlyDataMap[item._id] = {
        month: item._id,
        totalTicketsSold: item.totalTicketsSold,
        totalTicketAmount: item.totalTicketAmount,
        totalRevenue: item.totalRevenue, // Use the aggregated revenue
        totalPayouts: 0, 
        balance: item.totalTicketAmount - item.totalRevenue, 
      };
    });

    // Then process payouts and update the map
    payoutsAggregatedByMonth.forEach(item => {
      const existingData = monthlyDataMap[item._id];
      if (existingData) {
        // Add the payouts to the existing monthly record
        existingData.totalPayouts = item.totalPayouts;
        // Deduct the payouts from the balance
        existingData.balance -= item.totalPayouts;
      }
    });

    // Prepare the final documents to be inserted
    const summaryDocs = Object.values(monthlyDataMap);

    // Insert all documents at once for efficiency
    if (summaryDocs.length > 0) {
      console.log(`[recalculateMonthlySummaries] Inserting ${summaryDocs.length} new summary documents.`);
      await MonthlySummary.insertMany(summaryDocs);
      console.log('[recalculateMonthlySummaries] New summary documents inserted successfully.');
    } else {
      console.log('[recalculateMonthlySummaries] No successful sales found to create summaries.');
    }

    console.log('[recalculateMonthlySummaries] Full recalculation complete.');
    res.status(200).json({ status: true, message: "Monthly summaries successfully recalculated." });
  } catch (error) {
    console.error("Error during full recalculation of monthly summaries:", error);
    res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};


// API endpoint to get all monthly summaries
export const getAllMonthlySummaries = async (req, res) => {
  try {
    const summaries = await MonthlySummary.find().sort({ month: -1 });
    res.status(200).json({ status: true, data: summaries });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};
