import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Safely destructure with defaults
      const { user = {}, token = null } = action.payload || {};
      
      // Validate required fields
      if (!user._id) {
        console.error("User data missing _id field!", user);
        // Don't throw error to avoid breaking existing flows
        // Instead, try to get _id from token if possible
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          user._id = payload.id;
          console.warn('Fell back to JWT for user ID');
        } catch (e) {
          console.error('Could not get _id from token either');
        }
      }

      state.user = {
        _id: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        isAdmin: user.isAdmin || false,
        // Preserve any additional fields
        ...user
      };
      state.token = token;
      state.isAuthenticated = !!token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    // Add this to safely update user fields
    updateUserField: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    }
  },
});

export const { setUser, logout, updateUserField } = userSlice.actions;
export default userSlice.reducer;