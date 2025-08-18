import axios from "axios";
import { logout } from "../util/slices/userSlice";
import store from '../util/store'


export const api = axios.create({
    baseURL: "http://localhost:4444/api/users",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Use persisted token
  console.log("Sending token:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const createAccount = async (userData) => {
  try {
    const response = await api.post('/register', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      username: userData.username, 
      password: userData.password,
      termsAccepted: userData.termsAccepted,
      ...(userData.username && { username: userData.username })
    });

    if (!response.data.token) {
      console.warn('No token received in response:', response.data);
      throw new Error('Registration failed - no token received');
    }

    return {
      token: response.data.token,
      user: response.data.user,
      message: response.data.message
      
    };
    
  } catch (error) {
    console.error('Registration error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Handle specific error cases
    if (error.response?.status === 409) {
      throw new Error('Email already registered');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid input data');
    } else if (error.message.includes('Network Error')) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  }
};
  

export const loginAccount = async (data) => {
    try {
        const response = await api.post("/login", data)

        const token = response.data.token;
        if (token) {
          localStorage.setItem("token", token); // ✅ Save token
        }
        return {
          token: response.data.token,
          user: response.data.user, // Ensure backend returns user object with firstName
          message: response.data.message
          
        };
        
    } catch (error) {
        console.error("Error creating account", error)
        const errorMessage = error.response?.data?.message || error.message || "Failed to createAccount"
        throw new Error(errorMessage)
    }
}
export const Logout = async () => {
  try {
    const response = await api.get("/logout")
    return response.data
  } catch (error) {
    console.error("Error logging out account", error)
    const errorMessage = error.response?.data?.message || error.message || "Failed to logout"
    throw new Error(errorMessage)
  }
}
export const meAccount = async () => {
  try {
    const response = await api.get("/profile");
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch profile");
    }

    return {
      success: true,
      user: response.data.user
    };
  } catch (error) {
    console.error("Profile fetch error:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch profile");
  }
};

//update user profile
export const updateUserProfile = async (data) => {
  try {
    const response = await api.put("/profile/update", data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Profile update failed");
    }

    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error) {
    console.error("Profile update error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || "Validation error");
    } else if (error.response?.status === 404) {
      throw new Error("User not found");
    } else {
      throw new Error(error.response?.data?.message || "Failed to update profile");
    }
  }
};

//bank account details
export const updateAccountDetails = async (data) => {
  try {
    const response = await api.put("/account/details", data);
    
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to update account details");
    }

    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error) {
    console.error("Account update error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || "Validation error");
    } else {
      throw new Error(error.response?.data?.message || "Failed to update account details");
    }
  }
};

export const allUsers = async () => {
  try {
    const token = localStorage.getItem('token') || '';
    const response = await api.get('/admin/users', { // Changed endpoint
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Admin API error:', error);
    throw new Error(error.response?.data?.message || "Admin access required");
  }
};


export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete User Account
// export const deleteUserAccount = async (id) => {
//     try {
//       const response = await api.delete(`/${id}`);
//       return response.data;
//     } catch (error) {
//       console.error("Error deleting account:", error);
//       const errorMessage = error.response?.data?.message || error.message || "Failed to delete account";
//       throw new Error(errorMessage);
//     }
// };

// // Change Password
// export const changePassword = async (id, data) => {
//     try {
//       const response = await api.put(`/${id}/password`, data);
//       return response.data;
//     } catch (error) {
//       console.error("Error changing password:", error);
//       const errorMessage = error.response?.data?.message || error.message || "Failed to change password";
//       throw new Error(errorMessage);
//     }
// };


  

export default api