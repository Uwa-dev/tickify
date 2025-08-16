import { Router } from 'express';
import { protect, admin } from '../utils/createToken.js'; // Assuming your authentication middleware
import { 
    requestPayout, 
    getPayoutsForEvent, 
    getPayoutSummaryForEvent,
    getAllPayoutsAdmin,
    getSinglePayoutAdmin,
    completePayout,
    cancelPayout
} from '../controller/payoutController.js'; // Adjust path

const payoutRouter = Router();

payoutRouter.get('/all', protect, admin, getAllPayoutsAdmin)

// Route to request a new payout for a specific event
payoutRouter.post('/:eventId/request', protect, requestPayout);

// Route to get all payout requests for a specific event
payoutRouter.get('/:eventId', protect, getPayoutsForEvent);

// Route to get summary of payouts and total revenue for an event
payoutRouter.get('/:eventId/summary', protect, getPayoutSummaryForEvent);

payoutRouter.get('/admin/:payoutId', protect, getSinglePayoutAdmin);

payoutRouter.put('/:payoutId/admin/complete', protect, admin, completePayout);

// Route for organizer to cancel a payout
payoutRouter.put('/:payoutId/cancel', protect, cancelPayout);

export default payoutRouter;