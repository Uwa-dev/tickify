import axios from 'axios';
import store from "../util/store"; // Assuming this is for Redux store
import { logout } from "../util/slices/userSlice"; // Assuming this is for user logout

export const api = axios.create({ // Keep `api` as the named export
  baseURL: "http://localhost:4444/api/admin", // Base URL for admin-specific backend routes
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  // console.log("Sending token:", token); // Keep this for debugging if needed
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout()); // Dispatch logout action
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export const allUsers = async () => {
    try {
        // The token is already handled by the interceptor, no need to get it again here
        const response = await api.get('/all-users'); // Changed endpoint (if your backend uses /api/admin/all-users)

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        return response.data;
    } catch (error) {
        console.error('Admin API error:', error);
        throw new Error(error.response?.data?.message || "Admin access required");
    }
};

export const getAllEvents = async (params = {}) => {
  try {
    // FIXED: Changed endpoint from '/all-events' to '/events' to match backend route
    const response = await api.get('/events', { params });
    return response.data; // This returns { success: true, data: [...], pagination: {...} }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch events');
  }
};

export const toggleEventPublish = async (eventId) => {
  try {
    // FIXED: Removed redundant '/admin' from the path as baseURL already includes it
    const response = await api.patch(`/events/${eventId}/toggle-publish`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to toggle publish status');
  }
};

export const toggleUserBan = async(id) => {
  try{
    const response = await api.patch(`/users/${id}`);
    return response.data;
  }catch(error){
    console.error('API Error in toggleUserBan:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to toggle user ban status.');
  }
}

export const getUserData = async(id) => {
  try{
    const response = await api.get(`/users/${id}`);
    return response.data;
  }catch(error){
    throw new Error(error.response?.data?.error || "Failed to get the user's data");
  }
}

export const getPlatformFee = async() => {
  try{
    const response = await api.get('/platform-fee');
    return response.data;
  }catch(error){
    throw new Error(error.response?.data?.error || "Failed to get the platform fees");
  }
}

export const updatePlatformFee = async (newFee) => {
  // Ensure the data is sent in the correct JSON format
  const feeData = {
    newFeePercentage: newFee,
  };
  
  try {
    const response = await api.put('/platform-fee', feeData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to update the platform fees');
  }
};

export const getOrganizerMetrics = async(id) => {
  try {
    // Make sure 'id' is available before making the call
    if (!id) {
      throw new Error('User ID is required to fetch metrics.');
    }
    
    // The API URL now includes the 'id' parameter
    const response = await api.get(`/users/${id}/metrics`);
    return response.data;
  } catch(error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get business metric');
  }
};

export const getTotalUsers = async () => {
  try {
    const response = await api.get('/users/total-users');
    // We get the totalOrganizers count from the response data
    return response.data.totalOrganizers;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total users');
  }
};

export const ticketsSoldToday = async () => {
  try {
    const response = await api.get('/tickets/todays-ticket');
    // We get the count from the response data
    return response.data.count;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total number of tickets sold today');
  }
};

export const ticketsSoldThisMonth = async () => {
  try {
    const response = await api.get('/tickets/monthly-ticket');
    // We get the count from the response data
    return response.data.count;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total number of tickets sold this month');
  }
};

export const totalRevenueToday = async () => {
  try {
    const response = await api.get('/revenue');
    // We get the totalRevenue from the response data
    return response.data.totalRevenue;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total revenue made today');
  }
};

export const monthlyRevenue = async () => {
  try {
    const response = await api.get('/monthly-revenue');
    // We get the totalRevenue from the response data
    return response.data.totalRevenue;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total revenue made this month');
  }
};

export const getTotalPayout = async () => {
  try {
    const response = await api.get('/payout');
    // We get the pendingPayoutsCount from the response data
    return response.data.pendingPayoutsCount;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total number of payout requests');
  }
};

export const getAllFutureEvents = async () => {
  try {
    const response = await api.get('/future-events');
    // We return the length of the events array
    return response.data.data.length;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get total number of future events');
  }
};

export const getAllMonthlySummaries = async () => {
  try {
    const response = await api.get('/accounts');
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get monthly summaries');
  }
};



// Export the axios instance as default if other parts of your app use it directly
export default api;

