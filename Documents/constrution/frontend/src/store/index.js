import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import catalogReducer from './catalogSlice.js';
import quoteReducer from './quoteSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    quotes: quoteReducer,
  },
});

export default store;
