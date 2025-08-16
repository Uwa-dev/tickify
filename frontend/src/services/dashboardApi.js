import axios from 'axios';
import store from "../util/store"; // Assuming this is for Redux store
import { logout } from "../util/slices/userSlice"; // Assuming this is for user logout

const dashboardApi = axios.create({
  baseURL: "http://localhost:4444/api/dashboard", // Matches your backend route prefix
});

// Axios Interceptor for adding Authorization token to requests
dashboardApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios Interceptor for handling 401 Unauthorized responses
dashboardApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout()); // Dispatch logout action
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export const getDashboardSummary = async () => {
  try {
    const response = await dashboardApi.get('/summary'); // Matches backend GET /api/dashboard/summary
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch dashboard summary");
  }
};
