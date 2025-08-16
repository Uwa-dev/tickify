import axios from "axios";
import store from "../util/store";

export const paymentApi = axios.create({
    baseURL: "http://localhost:4444/api/payment"
})

export const initializePayment = async (formData) => {
  try {
    const response = await paymentApi.post('/initialize', formData);
    return response.data;
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error;
  }
};

export const verifyPayment = async (reference) => {
  try {
    const response = await paymentApi.get(`/verify?reference=${reference}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

export const checkPaymentStatus = async (reference) => {
  try {
    const response = await paymentApi.get(`/status/${reference}`);
    return response.data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
};