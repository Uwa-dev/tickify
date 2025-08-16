import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Reference to the Event model
      required: true,
    },
    ticketType: {
      type: String,
      required: true, // E.g., VIP, Regular
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      min: 1,
      default: Number.MAX_SAFE_INTEGER,
    },
    transferFee: {
      type: Boolean,
      default: false, // NEW FIELD: indicates if the fee is passed to the guest
    },
    promoCode: {
      type: String, // Promo code used for this ticket
      uppercase: true,
    },
    isCheckedIn: {
      type: Boolean,
      default: false, // Indicates if the ticket has been checked in
    },
    uniqueCode: {
      type: String,
      unique: true, // A unique code for ticket validation (e.g., QR Code)
      required: true,
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;