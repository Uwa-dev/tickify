import mongoose from "mongoose";

const monthlySummarySchema = new mongoose.Schema(
  {
    // The identifier for the month, e.g., "2024-03"
    month: {
      type: String,
      required: true,
      unique: true, // Ensures only one document per month
    },
    // The total number of tickets sold in this month
    totalTicketsSold: {
      type: Number,
      default: 0,
    },
    // The total amount of all tickets sold in this month
    totalTicketAmount: {
      type: Number,
      default: 0,
    },
    // Total revenue from all ticket sales in this month
    totalRevenue: {
      type: Number,
      default: 0,
    },
    // Total amount paid out to organizers for sales in this month
    totalPayouts: {
      type: Number,
      default: 0,
    },
    // The balance remaining for this month (totalRevenue - totalPayouts)
    // This represents the amount still to be paid out for this month's sales
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);
export default MonthlySummary;
