import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
    // The event this promo code belongs to
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // Reference to your Event model
        required: true,
    },
    // The actual promo code string (e.g., "SUMMER20")
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    // Type of discount: percentage or fixed amount
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage',
    },
    // Value of the discount (e.g., 10 for 10%, or 5000 for ₦5000 off)
    value: {
        type: Number,
        required: true,
        min: 0,
    },
    // Maximum number of times this promo code can be used (0 for unlimited)
    usageLimit: {
        type: Number,
        required: true,
        min: 0,
        default: 0, // 0 means unlimited usage
    },
    // How many times this promo code has been used so far
    timesUsed: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Date when the promo code expires
    expiryDate: {
        type: Date,
        required: true,
    },
    // Array of Ticket IDs this promo code applies to.
    // If empty, it applies to all tickets for the event.
    appliesToTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket', // Reference to your Ticket model
    }],
    // Status of the promo code (Active, Closed, Expired)
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Expired'],
        default: 'Active',
    },
    // Organizer who created the promo code (optional, but good for tracking)
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to your User model (assuming you have one)
        required: true,
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// ADDED: Compound unique index to ensure 'code' is unique per 'event'
promoCodeSchema.index({ event: 1, code: 1 }, { unique: true });

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);

export default PromoCode;