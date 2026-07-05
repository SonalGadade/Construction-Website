import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAPI } from '../utils/api.js';

export const fetchQuotes = createAsyncThunk('quotes/fetchQuotes', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/quotes');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const submitRFQ = createAsyncThunk('quotes/submitRFQ', async (rfqData, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/quotes', {
      method: 'POST',
      body: JSON.stringify(rfqData),
    });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const negotiateCounter = createAsyncThunk('quotes/negotiateCounter', async ({ id, items, message }, { rejectWithValue }) => {
  try {
    const data = await fetchAPI(`/quotes/${id}/negotiate`, {
      method: 'PUT',
      body: JSON.stringify({ items, message }),
    });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateRFQStatus = createAsyncThunk('quotes/updateRFQStatus', async ({ id, status, paymentMethod }, { rejectWithValue }) => {
  try {
    const data = await fetchAPI(`/quotes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, paymentMethod }),
    });
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchOrders = createAsyncThunk('quotes/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/orders');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const reorderPastOrder = createAsyncThunk('quotes/reorderPastOrder', async (orderId, { rejectWithValue }) => {
  try {
    const data = await fetchAPI(`/orders/${orderId}/reorder`, {
      method: 'POST',
    });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const quoteSlice = createSlice({
  name: 'quotes',
  initialState: {
    quotes: [],
    orders: [],
    loading: false,
    error: null,
    actionSuccess: false,
  },
  reducers: {
    clearQuoteState: (state) => {
      state.error = null;
      state.actionSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quotes
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit RFQ
      .addCase(submitRFQ.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = false;
      })
      .addCase(submitRFQ.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.unshift(action.payload);
        state.actionSuccess = true;
      })
      .addCase(submitRFQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Negotiate Quote
      .addCase(negotiateCounter.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q._id === action.payload._id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
      })
      // Approve/Reject RFQ Status
      .addCase(updateRFQStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.actionSuccess = false;
      })
      .addCase(updateRFQStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.actionSuccess = true;
        // The resolved output can contain both order conversion and status details
        if (action.payload?.order) {
          state.orders.unshift(action.payload.order);
        }
        // Refresh quotes
        const updatedQuote = action.payload?.data;
        if (updatedQuote) {
          const index = state.quotes.findIndex(q => q._id === updatedQuote._id);
          if (index !== -1) {
            state.quotes[index] = updatedQuote;
          }
        }
      })
      .addCase(updateRFQStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Orders
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });
  },
});

export const { clearQuoteState } = quoteSlice.actions;
export default quoteSlice.reducer;
