import express from 'express'
import {
    getAdminBroadcasts,
    getOrganizerBroadcasts,
    createBroadcast,
    getUserBroadcasts,
    getUnreadBroadcastsCount,
    markBroadcastAsRead
} from '../controller/broadcastController.js';
import {protect, admin} from '../utils/createToken.js';
const broadcastRouter = express.Router();


// Route to create a new broadcast
broadcastRouter.post('/', protect, admin, createBroadcast);

// Routes to fetch broadcasts based on user role
broadcastRouter.get('/admin', protect, admin, getAdminBroadcasts);
broadcastRouter.get('/organizer', protect, getOrganizerBroadcasts);
broadcastRouter.get('/user', protect, getUserBroadcasts);
broadcastRouter.get('/unread-count', protect, getUnreadBroadcastsCount);
broadcastRouter.get('/mark-as-read/:broadcastId', protect, markBroadcastAsRead)


export default broadcastRouter;