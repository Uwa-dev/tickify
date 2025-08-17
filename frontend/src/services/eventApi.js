import axios from "axios";
import store from "../util/store";
import Cookies from 'js-cookie';
import { logout } from "../util/slices/userSlice";

export const eventApi = axios.create({
  baseURL: "http://localhost:4444/api/events",
});

eventApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

eventApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const createEvent = async (formData) => {
  try {
    // const token = localStorage.getItem('token') || Cookies.get('jwt');
    
    const response = await eventApi.post('/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // 'Authorization': `Bearer ${token}`
      },
      withCredentials: true // For cookies
    });
    
    return response;
  } catch (error) {
    console.error('Event creation error:', error);
    throw error;
  }
};

// Get events by organizer
export const getEventsByOrganizer = async () => {
  try {
    const response = await eventApi.get("/organizer");
    return response.data;
  } catch (error) {
    console.error("Error fetching organizer's events:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch events"
    );
  }
};

// Get an individual event
export const getEventById = async (eventId) => {
  
  try {
    const response = await eventApi.get(`/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch event"
    );
  }
};

// Update an event
export const updateEvent = async (eventId, data) => {
  try {
    console.log('Sending update request with token:', localStorage.getItem("token"));
    let response;
    
    if (data instanceof FormData) {
      console.log('FormData contents:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }
      // For multipart/form-data (file upload)
      response = await eventApi.put(`/${eventId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // For regular JSON data
      console.log('JSON data:', data);
      response = await eventApi.put(`/${eventId}`, data);
    }
    
    return response.data;
  } catch (error) {
    console.error("Full error object:", error);
    console.error("Error response data:", error.response?.data);
    throw new Error(
      error.response?.data?.message || error.message || "Failed to update event"
    );
  }
};

export const toggleEventPublish = async (eventId) => {
  try {
    const response = await eventApi.patch(`/${eventId}/toggle-publish`);
    return response.data;
  } catch (error) {
    console.error("Error toggling event publish status:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to toggle publish status");
  }
};

export const generateQRCode = async(qrData) => {
  try {
    const response = await eventApi.post('/generate-qr', qrData);
    return response.data;
  } catch (error) {
    console.error("Error generating QR Code:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Failed to generate QR Code"
    );
  }
}


// Delete a finished event
export const deleteFinishedEvent = async (id) => {
  try {
    const response = await eventApi.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting finished event:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Failed to delete event"
    );
  }
};

// Get published events by organizer
export const getPublishedEventsByOrganizer = async () => {
  try {
    const response = await eventApi.get("/organizer/published");
    return response.data;
  } catch (error) {
    console.error("Error fetching published events:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch published events"
    );
  }
};

// Delete a published event with no ticket sales
export const deleteUnsoldPublishedEvent = async (id) => {
  try {
    const response = await eventApi.delete(`/${id}/unsold`);
    return response.data;
  } catch (error) {
    console.error("Error deleting unsold event:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to delete unsold event"
    );
  }
};

// Get event with organizer details (Admin only)
export const getEventWithOrganizerDetails = async (id) => {
  try {
    const response = await eventApi.get(`/${id}/with-organizer`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event with organizer details:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch event details"
    );
  }
};
