import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model for organizers
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;
