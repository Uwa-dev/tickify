// config/paystackConfig.js
import paystackPackage from 'paystack-api';
import dotenv from "dotenv";
dotenv.config();

const paystack = paystackPackage(process.env.PAYSTACK_SECRET_KEY);

export default paystack;