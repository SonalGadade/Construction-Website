import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAPI } from '../utils/api.js';

// Thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('token', data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const loginWithOtp = createAsyncThunk('auth/loginWithOtp', async ({ phone, otp }, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/auth/otp-verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    localStorage.setItem('token', data.token);
    return data.user;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchAPI('/auth/me');
    return data.data;
  } catch (error) {
    localStorage.removeItem('token');
    return rejectWithValue(error.message);
  }
});

const initialState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  // Coordinates for Noida (default placeholder user location)
  coordinates: {
    latitude: 28.62,
    longitude: 77.37,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    updateCoordinates: (state, action) => {
      state.coordinates = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (action.payload.address?.coordinates?.latitude) {
          state.coordinates = action.payload.address.coordinates;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // OTP Login
      .addCase(loginWithOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (action.payload.address?.coordinates?.latitude) {
          state.coordinates = action.payload.address.coordinates;
        }
      })
      .addCase(loginWithOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (action.payload.address?.coordinates?.latitude) {
          state.coordinates = action.payload.address.coordinates;
        }
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, updateCoordinates, clearError } = authSlice.actions;
export default authSlice.reducer;
