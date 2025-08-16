import mongoose from "mongoose";

const TicketSalesSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // Reference to Event model
        required: true
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket', // Reference to Ticket model
        required: true
    },
    buyer: {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        }
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentReference: {
        type: String,
        required: true,
        // unique: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Successful', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Card', 'Bank Transfer', 'USSD', 'Other'],
        required: true
    },
    checkInStatus: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
TicketSalesSchema.index({ event: 1 });
TicketSalesSchema.index({ ticket: 1 });
TicketSalesSchema.index({ paymentReference: 1 });
TicketSalesSchema.index({ 'buyer.email': 1 });

const TicketSales = mongoose.model("TicketSales", TicketSalesSchema);
export default TicketSales;