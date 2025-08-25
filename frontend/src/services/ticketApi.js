import axios from "axios";
import store from "../util/store";
import { logout } from "../util/slices/userSlice";

export const ticketApi = axios.create({
  baseURL: "http://localhost:4444/api/tickets",
});

ticketApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ticketApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Create a ticket
export const createTicket = async (data) => {
  try {
    const response = await ticketApi.post("/create", data);
    return response.data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to create ticket");
  }
};


export const getTicketsOfAnEvent = async(eventId) => { // <--- FIXED: eventId added as a parameter
  try{
    // Assuming your backend route is /api/tickets/event/:eventId
    const response = await ticketApi.get(`/event/${eventId}`); // <--- Using eventId here
    return response.data;
  }catch(error){
    console.error("Error getting tickets:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to get tickets for event"); // More specific error message
  }
}

export const deleteTicket = async (ticketId) => {
  try {
    // Assuming the DELETE endpoint for a ticket is /api/tickets/:ticketId
    const response = await ticketApi.delete(`/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting ticket:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to delete ticket");
  }
};

export const getTicketById = async (ticketId) => {
  try {
    // Assuming the GET endpoint for a single ticket is /api/tickets/:ticketId
    const response = await ticketApi.get(`/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ticket by ID:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch ticket");
  }
};

export const updateTicket = async (eventId, ticketId, updates) => { // FIXED: Added eventId parameter
  try {
    // FIXED: Assuming the PUT endpoint for updating a ticket is /api/tickets/:eventId/:ticketId
    const response = await ticketApi.put(`/${eventId}/${ticketId}`, updates); // FIXED: Include both eventId and ticketId in URL
    return response.data;
  } catch (error) {
    console.error("Error updating ticket:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to update ticket");
  }
};

export const createPromoCode = async (eventId, promoCodeData) => {
  try {
    const response = await ticketApi.post(`/event/promo-code/${eventId}`, promoCodeData);
    return response.data;
  } catch (error) {
    console.error("Error creating promo code:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to create promo code");
  }
};

export const getPromoCodesForEvent = async (eventId) => {
  try {
    const response = await ticketApi.get(`/event/promo-code/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch promo codes");
  }
};

export const updatePromoCodeStatus = async (promoCodeId, status) => {
  try {
    const response = await ticketApi.put(`/promo-code/${promoCodeId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating promo code status:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to update promo code status");
  }
};

export const deletePromoCode = async (promoCodeId) => {
  try {
    const response = await ticketApi.delete(`/promo-code/${promoCodeId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting promo code:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to delete promo code");
  }
};

export const getEventSalesSummary = async (eventId) => {
  try{
    console.log("Calling sales summary for event:", eventId);
    const response = await ticketApi.get(`/${eventId}/sales-summary`)
    console.log("Sales summary response:", response.data);
    return response.data;
  }catch(error){
    console.error("Error fetching tickets sales summary:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch tickets");
  }
}

export const getRegularGuests = async () => {
  try {
    const response = await ticketApi.get('/regular'); // Matches backend GET /api/regular-guests
    return response.data;
  } catch (error) {
    console.error("Error fetching regular guests:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch regular guests");
  }
};

// View purchased tickets
export const viewPurchasedTickets = async () => {
  try {
    const response = await ticketApi.get("/view-purchased-ticket");
    return response.data;
  } catch (error) {
    console.error("Error fetching purchased tickets:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch purchased tickets");
  }
};

// Validate a ticket
export const validateTicket = async (data) => {
  try {
    const response = await ticketApi.put("/validate", data);
    return response.data;
  } catch (error) {
    console.error("Error validating ticket:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to validate ticket");
  }
};



