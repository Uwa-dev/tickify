import { Router } from 'express';
import { protect } from '../utils/createToken.js'; // Assuming your authentication middleware
import { getOrganizerDashboardSummary } from "../controller/dashboardController.js" // Adjust path

const dashboardRouter = Router();

// Route to get the dashboard summary for the authenticated organizer
dashboardRouter.get('/summary', protect, getOrganizerDashboardSummary);

export default dashboardRouter;