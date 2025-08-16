import axios from 'axios';
import store from "../util/store"; // Assuming this is for Redux store
import { logout } from "../util/slices/userSlice"; // Assuming this is for user logout

const payoutApi = axios.create({
  baseURL: "http://localhost:4444/api/payouts", // Matches your backend route prefix
});

// Axios Interceptor for adding Authorization token to requests
payoutApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios Interceptor for handling 401 Unauthorized responses
payoutApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout()); // Dispatch logout action
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export const requestPayout = async (eventId, payoutData) => {
  try {
    const response = await payoutApi.post(`/${eventId}/request`, payoutData);
    return response.data;
  } catch (error) {
    console.error("Error requesting payout:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to request payout");
  }
};

export const getPayoutsForEvent = async (eventId) => {
  try {
    const response = await payoutApi.get(`/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payouts:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch payouts");
  }
};

export const getPayoutSummaryForEvent = async (eventId) => {
  try {
    const response = await payoutApi.get(`/${eventId}/summary`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch payout summary");
  }
};

// Add this new function to your existing payoutApi.js file
export const getAllPayoutsAdmin = async () => {
  try {
    const response = await payoutApi.get('/all'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching all payouts for admin:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch all payouts");
  }
};

export const getSinglePayoutAdmin = async (payoutId) => {
  try {
    const response = await payoutApi.get(`/admin/${payoutId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching single payout for admin:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch payout details");
  }
};

// New API call for admin to complete payout
export const completePayoutAdmin = async (payoutId, data = {}) => {
  try {
    const response = await payoutApi.put(`/${payoutId}/admin/complete`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// New API call for organizer to cancel payout
export const cancelPayoutOrganizer = async (payoutId) => {
  try {
    const response = await payoutApi.put(`${payoutId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};
