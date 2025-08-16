import express from 'express';
import { protect, admin } from '../utils/createToken.js';
import { 
    getOrganizersStats,
    toggleUserBanStatus,
    getUserById,
    getTotalUsers
} from '../controller/userController.js';

import { 
    getAllEvents,
    allFutureEvents
} from '../controller/eventController.js';

import {
    ticketsSoldToday,
    ticketsSoldThisMonth,
    totalRevenueToday,
    monthlyRevenue
} from '../controller/ticketSalesController.js';

import { getTotalPayout, getOrganizerMetrics } from '../controller/payoutController.js';

import { getAllMonthlySummaries } from '../controller/monthlySummaryController.js';

const adminRouter = express.Router();


adminRouter.get('/users/total-users', protect, admin, getTotalUsers);
adminRouter.get('/all-users', protect, admin, getOrganizersStats);
adminRouter.get('/events', protect, admin, getAllEvents);
adminRouter.get('/future-events', protect, admin, allFutureEvents);
adminRouter.patch('/users/:id', protect, admin, toggleUserBanStatus);
adminRouter.get('/users/:id', protect, admin, getUserById); 
adminRouter.get('/tickets/todays-ticket', protect, admin, ticketsSoldToday);
adminRouter.get('/tickets/monthly-ticket', protect, admin, ticketsSoldThisMonth);
adminRouter.get('/revenue', protect, admin, totalRevenueToday);
adminRouter.get('/monthly-revenue', protect, admin, monthlyRevenue);
adminRouter.get('/payout', protect, admin, getTotalPayout);
adminRouter.get('/users/:id/metrics', protect, admin, getOrganizerMetrics)
adminRouter.get('/accounts', protect, admin, getAllMonthlySummaries)



export default adminRouter;