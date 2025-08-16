import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createEvent,
  getEventsByOrganizer,
} from "../../services/eventApi"; // Import your API functions

// Thunks for async API calls
export const fetchEventsByOrganizer = createAsyncThunk(
  "events/fetchEventsByOrganizer",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getEventsByOrganizer();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewEvent = createAsyncThunk(
  "events/createNewEvent",
  async (eventData, { rejectWithValue }) => {
    try {
      const data = await createEvent(eventData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition
const eventSlice = createSlice({
  name: "events",
  initialState: {
    events: [],
    event: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearEventState: (state) => {
      state.event = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventsByOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsByOrganizer.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEventsByOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
      })
      .addCase(createNewEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEventState } = eventSlice.actions;

export default eventSlice.reducer;
