import express from "express";
import cors from "cors";
import connectDB from "./dbConnection.js";
import userRouter from "./routes/userRoutes.js";
import ticketRouter from './routes/ticketRoutes.js';
import eventRouter from "./routes/eventRoutes.js";
import dotenv from "dotenv";
import multer from "multer";
import cookieParser from 'cookie-parser';
import adminRouter from "./routes/adminRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import payoutRouter from "./routes/payoutRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import feeRouter from "./routes/platformFeeRoutes.js";
import broadcastRouter from "./routes/broadcastRoutes.js";
dotenv.config();

const app = express();
connectDB();

const port = 4444;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL
  credentials: true
}));

app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter, feeRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/events', eventRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/public', publicRouter);
app.use('/api/payouts', payoutRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/broadcast', broadcastRouter);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

