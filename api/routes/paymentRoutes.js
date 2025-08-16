import express from 'express';
import {
  initializePayment,
  verifyPayment,
  checkPaymentStatus,
  getEventTicketSales,
  getAllActiveEventTicketSales,
  getSalesAnalytics,
} from '../controller/paymentController.js';

import { protect, admin } from '../utils/createToken.js';

const paymentRouter = express.Router();

// Initialize payment
paymentRouter.post('/initialize', initializePayment);

// Verify payment callback (Paystack will call this)
paymentRouter.get('/verify', verifyPayment);

// Check payment status
paymentRouter.get('/status/:reference', checkPaymentStatus);

paymentRouter.get('/organizer/event-sales/:eventId', protect, getEventTicketSales);

// Admin routes
paymentRouter.get('/admin/all-sales', protect, admin, getAllActiveEventTicketSales);
paymentRouter.get('/admin/sales-analytics', protect, admin, getSalesAnalytics);

// Check-in management (could be organizer or admin)
// paymentRouter.patch('/check-in/:ticketSaleId', protect, updateTicketCheckIn);

export default paymentRouter;