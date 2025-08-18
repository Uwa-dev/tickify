import express from "express";
import {
    getEventByCustomUrl,
    getAllPublishedEvents
} from "../controller/eventController.js";
import { validatePromoCode } from "../controller/ticketController.js";
import {checkIn} from "../controller/ticketSalesController.js";


const publicRouter = express.Router();

publicRouter.get("/published", getAllPublishedEvents); 
publicRouter.get('/:customUrl', getEventByCustomUrl); 
publicRouter.post('/promocode/validate', validatePromoCode);
publicRouter.patch('/check-in/:eventId', checkIn)


export default publicRouter;