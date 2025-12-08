import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "../../api/services/authService";

type Payload = {
  email: string;
  password: string;
};

export const loginUser = createAsyncThunk<any, Payload>(
  "auth/login",
  async (credential, { rejectWithValue }) => {
    try {
      const data = await authService.login(credential);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const signupUser = createAsyncThunk<any, Payload>(
  "auth/register",
  async (signupData, { rejectWithValue }) => {
    try {
      const data = await authService.register(signupData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    } 
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const status = await authService.checkAuthStatus();
      return status;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: false,
  success: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state: any) => {
      state.error = null;
    },
    clearSuccess: (state: any) => {
      state.success = false;
    },
    setCredentials: (state: any, action) => {
      state.user = action.payload.user;
      (state.isAuthenticated = true), (state.isInitialized = true);
    },
    clearCredentials: (state: any) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    // Set auth state from external events (cookie changes)
    setAuthState: (state: any, action) => {
      (state.user = action.payload.user),
        (state.isAuthenticated = action.payload.isAuthenticated);
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state: any) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state: any, action) => {
        state.isLoading = false;
        state.success = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state: any, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.success = false;
        state.isInitialized = true;
      })

      // Signup cases
      .addCase(signupUser.pending, (state: any) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(signupUser.fulfilled, (state: any, action) => {
        state.isLoading = false;
        state.success = true;
        // Only set auth if user is returned (auto-login after signup)
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(signupUser.rejected, (state: any, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
        state.isInitialized = true;
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state: any) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.success = false;
        state.isInitialized = true;
      })

      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state: any) => {
        if (!state.isInitialized) {
          state.isLoading = true;
        }
      })
      .addCase(checkAuthStatus.fulfilled, (state: any, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isLoading = false;
        state.isInitialized = true;
      })
      .addCase(checkAuthStatus.rejected, (state: any) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitialized = true;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setCredentials,
  clearCredentials,
  setAuthState,
} = authSlice.actions;

export default authSlice.reducer;
