import express from "express";
import {
    getEventByCustomUrl,
    getAllPublishedEvents
} from "../controller/eventController.js";

import { validatePromoCode } from "../controller/ticketController.js";


const publicRouter = express.Router();

publicRouter.get("/published", getAllPublishedEvents); 
publicRouter.get('/:customUrl', getEventByCustomUrl); 
publicRouter.post('/promocode/validate', validatePromoCode);


export default publicRouter;