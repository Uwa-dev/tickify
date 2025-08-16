import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createTicket,
  viewPurchasedTickets,
  validateTicket,
} from "../../services/ticketApi"; // Import the API functions

// Thunks for async API calls
export const fetchPurchasedTickets = createAsyncThunk(
  "tickets/fetchPurchasedTickets",
  async (_, { rejectWithValue }) => {
    try {
      const data = await viewPurchasedTickets();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addNewTicket = createAsyncThunk(
  "tickets/addNewTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      const data = await createTicket(ticketData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const validateTicketAsync = createAsyncThunk(
  "tickets/validateTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      const data = await validateTicket(ticketData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTicketsByEvent = createAsyncThunk(
  "tickets/fetchTicketsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const data = await getTicketsByEvent(eventId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition
const ticketSlice = createSlice({
  name: "tickets",
  initialState: {
    tickets: [],
    purchasedTickets: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTicketsState: (state) => {
      state.tickets = [];
      state.purchasedTickets = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Purchased Tickets
      .addCase(fetchPurchasedTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchasedTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.purchasedTickets = action.payload;
      })
      .addCase(fetchPurchasedTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add New Ticket
      .addCase(addNewTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.push(action.payload);
      })
      .addCase(addNewTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate Ticket
      .addCase(validateTicketAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateTicketAsync.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(validateTicketAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Tickets by Event
      .addCase(fetchTicketsByEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsByEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsByEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTicketsState } = ticketSlice.actions;

export default ticketSlice.reducer;
