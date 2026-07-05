import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAPI } from '../utils/api.js';

export const fetchProducts = createAsyncThunk('catalog/fetchProducts', async (filters, { rejectWithValue }) => {
  try {
    let queryStr = '';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      queryStr = `?${params.toString()}`;
    }
    const data = await fetchAPI(`/products${queryStr}`);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchSeasonalSuggestions = createAsyncThunk('catalog/fetchSeasonal', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/products/seasonal/suggestions');
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchNearestWarehouse = createAsyncThunk('catalog/fetchNearestWarehouse', async (coords, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/warehouses/nearest', {
      method: 'POST',
      body: JSON.stringify(coords),
    });
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchLowStockAlerts = createAsyncThunk('catalog/fetchLowStockAlerts', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/products/alerts/low-stock');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    products: [],
    seasonal: null,
    nearestWarehouse: null,
    allWarehouses: [],
    lowStockAlerts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Seasonal
      .addCase(fetchSeasonalSuggestions.fulfilled, (state, action) => {
        state.seasonal = action.payload;
      })
      // Warehouse
      .addCase(fetchNearestWarehouse.fulfilled, (state, action) => {
        state.nearestWarehouse = action.payload.nearest;
        state.allWarehouses = action.payload.all;
      })
      // Low Stock
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.lowStockAlerts = action.payload;
      });
  },
});

export default catalogSlice.reducer;
