import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import tenantBootstrapReducer from "./tenantBootstrapSlice";
import flightSearchReducer from "./flightSearchSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenantBootstrap: tenantBootstrapReducer,
    flightSearch: flightSearchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;