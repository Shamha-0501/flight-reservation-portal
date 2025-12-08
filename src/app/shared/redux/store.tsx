import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { currencyReducer, persistCurrencyToStorage } from "./slices/currencySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    currency: currencyReducer
  },

  devTools: process.env.DEV !== "false",
});

store.subscribe(() => {
  const state = store.getState() as RootState;
  persistCurrencyToStorage(state.currency.selectedCode);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
