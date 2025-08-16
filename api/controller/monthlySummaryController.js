import mongoose from 'mongoose';
import MonthlySummary from '../models/monthlySummaryModel.js';
import TicketSales from '../models/ticketSalesModel.js';
import Payout from '../models/payoutModel.js';

// Helper function to find or create a monthly summary document
const findOrCreateMonthlySummary = async (month) => {
  let summary = await MonthlySummary.findOne({ month });
  if (!summary) {
    summary = new MonthlySummary({
      month,
      totalRevenue: 0,
      totalTicketsSold: 0,
      totalPayouts: 0,
      balance: 0,
      totalTicketAmount: 0, // Initialize the new field
    });
    await summary.save();
  }
  return summary;
};

// This function is called when a successful ticket sale occurs
// It updates the monthly summary for the sale month.
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
    const summary = await findOrCreateMonthlySummary(saleMonth);
    
    // Atomically update the summary document
    summary.totalRevenue += sale.totalAmount;
    summary.totalTicketsSold += sale.quantity;
    summary.balance += sale.totalAmount; 
    summary.totalTicketAmount += sale.totalAmount; // Update the new field
    
    await summary.save();
    console.log(`Monthly summary for ${saleMonth} updated successfully.`);
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
    
    // Find all successful sales for the event
    const sales = await TicketSales.find({
      event: payout.event,
      paymentStatus: 'Successful',
    }).sort({ createdAt: 1 });

    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    if (totalSalesAmount === 0) {
      console.warn('No successful sales to deduct payout from.');
      return;
    }

    let remainingPayoutAmount = payout.amount;
    
    // Deduct payout amount from monthly balances in reverse chronological order
    const salesByMonth = sales.reduce((acc, sale) => {
      const month = sale.createdAt.toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { totalRevenue: 0, sales: [] };
      }
      acc[month].totalRevenue += sale.totalAmount;
      return acc;
    }, {});
    
    const sortedMonths = Object.keys(salesByMonth).sort().reverse();
    
    for (const month of sortedMonths) {
      if (remainingPayoutAmount <= 0) break;
      
      const summary = await findOrCreateMonthlySummary(month);
      const monthlyRevenue = salesByMonth[month].totalRevenue;
      
      const amountToDeduct = Math.min(remainingPayoutAmount, monthlyRevenue);
      
      summary.totalPayouts += amountToDeduct;
      summary.balance -= amountToDeduct;
      await summary.save();
      
      remainingPayoutAmount -= amountToDeduct;
    }

    console.log(`Payout for ID ${payoutId} successfully allocated and summaries updated.`);

  } catch (error) {
    console.error("Error updating monthly summary after payout:", error);
  }
};

// --- This is the improved function to recalculate all monthly summaries from existing data ---
export const recalculateMonthlySummaries = async (req, res) => {
  try {
    // Step 1: Delete all existing monthly summaries to start fresh
    await MonthlySummary.deleteMany({});
    
    // Step 2: Find all successful ticket sales and payouts
    const successfulSales = await TicketSales.find({ paymentStatus: 'Successful' });
    const allPayouts = await Payout.find({});
    
    // Step 3: Process all sales first and update summaries with revenue and tickets
    // This is the part that was likely causing the discrepancy.
    for (const sale of successfulSales) {
      const saleMonth = sale.createdAt.toISOString().slice(0, 7);
      
      // Use findOneAndUpdate with $inc for atomic updates and to handle concurrency
      await MonthlySummary.findOneAndUpdate(
        { month: saleMonth },
        {
          $inc: {
            totalTicketsSold: sale.quantity,
            totalTicketAmount: sale.totalAmount,
            totalRevenue: sale.totalAmount,
            balance: sale.totalAmount,
          },
        },
        { upsert: true, new: true } // upsert creates a new doc if none exists
      );
    }
    
    // Step 4: Now, process all payouts and deduct from the corresponding monthly balances
    for (const payout of allPayouts) {
      // Find all successful sales for the event related to this payout
      const payoutEventSales = successfulSales.filter(sale => String(sale.event) === String(payout.event));
      
      let remainingPayoutAmount = payout.amount;
      
      // Group sales by month to correctly allocate the payout
      const salesByMonth = payoutEventSales.reduce((acc, sale) => {
        const month = sale.createdAt.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { totalRevenue: 0 };
        }
        acc[month].totalRevenue += sale.totalAmount;
        return acc;
      }, {});
      
      // Sort months in reverse chronological order to deduct from the latest months first
      const sortedMonths = Object.keys(salesByMonth).sort().reverse();
      
      for (const month of sortedMonths) {
        if (remainingPayoutAmount <= 0) break;
        
        const monthlyRevenue = salesByMonth[month].totalRevenue;
        const amountToDeduct = Math.min(remainingPayoutAmount, monthlyRevenue);
        
        // Atomically update the summary with payouts and new balance
        await MonthlySummary.findOneAndUpdate(
          { month: month },
          {
            $inc: {
              totalPayouts: amountToDeduct,
              balance: -amountToDeduct,
            },
          }
        );
        remainingPayoutAmount -= amountToDeduct;
      }
    }
    
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

// API endpoint to get tickets sold this month
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
