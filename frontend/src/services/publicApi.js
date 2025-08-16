import axios from 'axios';

export const publicApi = axios.create({
    baseURL: "http://localhost:4444/api/public",
})

//get events by Custom Url
export const getEventByCustomUrl = async (customUrl) => {
  try {
    const response = await publicApi.get(`${customUrl}`);
    return response.data;
  } catch (error) {
    // Pass along the error response for proper handling
    console.error('API Error:', error);
    throw error;
  }
};

// Get all published events
export const getAllPublishedEvents = async () => {
  try {
    const response = await publicApi.get("/published");
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

export const validatePromoCode = async (eventId, code, ticketIds) => {
  try {
    const response = await publicApi.post('/promocode/validate', { eventId, code, ticketIds});
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};