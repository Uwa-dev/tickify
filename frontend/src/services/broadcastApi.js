import axios from 'axios';

export const broadcastApi = axios.create({
    baseURL: "http://localhost:4444/api/broadcast",
});


broadcastApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Example: get token from localStorage

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- API Functions using the configured axios instance ---

export const createBroadcast = async (broadcastPayload) => {
    try {
        const response = await broadcastApi.post('/', broadcastPayload);
        return response.data; // Axios wraps the response in a 'data' property
    } catch (error) {
        console.error("API Error: createBroadcast", error);
        throw error;
    }
};


export const getAdminBroadcasts = async () => {
    try {
        const response = await broadcastApi.get('/admin');
        return response.data;
    } catch (error) {
        console.error("API Error: getAdminBroadcasts", error);
        throw error;
    }
};


export const getOrganizerBroadcasts = async () => {
    try {
        const response = await broadcastApi.get('/organizer');
        return response.data;
    } catch (error) {
        console.error("API Error: getOrganizerBroadcasts", error);
        throw error;
    }
};


export const getUserBroadcasts = async () => {
    try {
        const response = await broadcastApi.get('/user');
        return response.data;
    } catch (error) {
        console.error("API Error: getUserBroadcasts", error);
        throw error;
    }
};

// New function to fetch the unread broadcast count from the backend
export const getUnreadBroadcastsCount = async () => {
    try {
        const response = await broadcastApi.get('/unread-count');
        return response.data;
    } catch (error) {
        console.error("API Error: getUnreadBroadcastsCount", error);
        throw error;
    }
};

// New function to mark a specific broadcast as read
export const markBroadcastAsRead = async (broadcastId) => {
    try {
        await broadcastApi.post(`/mark-as-read/${broadcastId}`);
    } catch (error) {
        console.error("API Error: markBroadcastAsRead", error);
        throw error;
    }
};