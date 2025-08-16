import express from 'express';
import { protect } from '../utils/createToken.js';
import { 
    createTicket,
    getTicketsOfAnEvent,
    updateTicket,
    deleteTicket,
    getTicketById, 
    createPromoCode,
    getPromoCodesForEvent,
    updatePromoCodeStatus,
    deletePromoCode
} from '../controller/ticketController.js';
import {getSalesSummary, getRegularGuests} from '../controller/ticketSalesController.js';

const ticketRouter = express.Router();

ticketRouter.get('/regular', protect, getRegularGuests);
ticketRouter.post('/create', protect, createTicket);
ticketRouter.get("/event/:eventId", protect, getTicketsOfAnEvent);
ticketRouter.put("/:eventId/:ticketId", protect, updateTicket); 
ticketRouter.get('/:eventId/sales-summary', protect, getSalesSummary);
ticketRouter.delete('/:ticketId', protect, deleteTicket);
ticketRouter.get('/:ticketId', protect, getTicketById );
ticketRouter.post('/event/promo-code/:eventId', protect, createPromoCode);
ticketRouter.get('/event/promo-code/:eventId', protect, getPromoCodesForEvent);
ticketRouter.put('/promo-code/:promoCodeId/status', protect, updatePromoCodeStatus);
ticketRouter.delete('/promo-code/:promoCodeId', protect, deletePromoCode);



export default ticketRouter;