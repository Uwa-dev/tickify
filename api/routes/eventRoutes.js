import express from "express";
import {
    createEvent,
    getEventsByOrganizer,
    getEventById,
    updateEvent,
    toggleEventPublishStatus,
    generateQRCode,

    deleteFinishedEvent,
    getPublishedEventsByOrganizer,
    deleteUnsoldPublishedEvent,
    getEventWithOrganizerDetails,
    saveEventData
} from "../controller/eventController.js";
import { protect, admin } from "../utils/createToken.js";
import upload from "../middleware/upload.js"

const eventRouter = express.Router();



// eventRouter.post("/create",  upload.single('eventImage'), protect, createEvent); // Create an event
eventRouter.post("/create", upload.single('eventImage'), (req, res, next) => {
  console.log('Multer processed file:', req.file);
  next();
}, protect, createEvent);
eventRouter.get("/organizer", protect, getEventsByOrganizer); // Get events by an organizer
eventRouter.get("/:eventId", protect, getEventById); // Get an individual event
eventRouter.put("/:eventId", protect, updateEvent); // Update an event
eventRouter.patch("/:eventId/toggle-publish", protect, toggleEventPublishStatus);
eventRouter.post("/generate-qr", protect, generateQRCode);

eventRouter.delete("/:id", protect, deleteFinishedEvent); // Delete a finished event
eventRouter.get("/organizer/published", protect, getPublishedEventsByOrganizer); // Get published events by organizer
eventRouter.delete("/:id/unsold", protect, deleteUnsoldPublishedEvent); // Delete a published event with no ticket sales
eventRouter.get("/:id/with-organizer", protect, admin, getEventWithOrganizerDetails);

eventRouter.post('/save-event-step', saveEventData);



export default eventRouter;
