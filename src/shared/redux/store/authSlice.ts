import { csrf, http } from "@/src/api/config/http";
import type { AuthTenant, AuthUser } from "@/src/shared/auth/authModel";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type ApiErrors = Record<string, string[]>;

type AuthResponse = {
  ok: boolean;
  user: AuthUser;
  tenant?: AuthTenant;
  errors?: ApiErrors;
  message?: string;
};

type MeResponse = {
  ok: boolean;
  user: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  authStatus: "unknown" | "authenticated" | "guest";
  requestStatus: "idle" | "loading" | "error";
  error: string | null;
  fieldErrors: ApiErrors;
  successMessage: string | null;
  meChecked: boolean;
};

type HttpErrorLike = {
  response?: {
    data?: {
      message?: string;
      errors?: ApiErrors;
    };
  };
};

const initialState: AuthState = {
  user: null,
  authStatus: "unknown",
  requestStatus: "idle",
  error: null,
  fieldErrors: {},
  successMessage: null,
  meChecked: false,
};

function getApiErrors(error: unknown): ApiErrors {
  return (error as HttpErrorLike)?.response?.data?.errors ?? {};
}

function getApiMessage(error: unknown, fallback: string) {
  const response = (error as HttpErrorLike)?.response?.data;
  return (
    response?.message ||
    response?.errors?.email?.[0] ||
    response?.errors?.password?.[0] ||
    fallback
  );
}

export const authMe = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<MeResponse>("/api/me");
      if (!data?.ok || !data?.user) return rejectWithValue("Not authenticated");
      return data.user;
    } catch {
      return rejectWithValue("Not authenticated");
    }
  },
);

export const login = createAsyncThunk<
  AuthUser,
  { email: string; password: string; remember?: boolean },
  { rejectValue: { message: string; fieldErrors: ApiErrors } }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    await csrf();
    const { data } = await http.post<AuthResponse>("/auth/login", payload);

    if (!data?.ok || !data?.user) {
      return rejectWithValue({
        message: "Unexpected login response.",
        fieldErrors: {},
      });
    }

    return data.user;
  } catch (error: unknown) {
    return rejectWithValue({
      message: getApiMessage(error, "Login failed."),
      fieldErrors: getApiErrors(error),
    });
  }
});

export const registerCustomer = createAsyncThunk<
  { user: AuthUser; message: string },
  {
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    role: "customer";
    terms: boolean;
  },
  { rejectValue: { message: string; fieldErrors: ApiErrors } }
>("auth/registerCustomer", async (payload, { rejectWithValue }) => {
  try {
    await csrf();
    const { data } = await http.post<AuthResponse>("/auth/register/customer", payload);

    if (!data?.ok || !data?.user) {
      return rejectWithValue({
        message: data?.message || "Unexpected register response.",
        fieldErrors: data?.errors ?? {},
      });
    }

    return {
      user: data.user,
      message: data.message || "Customer account created successfully.",
    };
  } catch (error: unknown) {
    return rejectWithValue({
      message: getApiMessage(error, "Customer registration failed."),
      fieldErrors: getApiErrors(error),
    });
  }
});

export const registerAgency = createAsyncThunk<
  { message: string },
  FormData,
  { rejectValue: { message: string; fieldErrors: ApiErrors } }
>("auth/registerAgency", async (payload, { rejectWithValue }) => {
  try {
    await csrf();
    const { data } = await http.post<AuthResponse>("/auth/register/agency", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!data?.ok) {
      return rejectWithValue({
        message: data?.message || "Unexpected agency registration response.",
        fieldErrors: data?.errors ?? {},
      });
    }

    return {
      message:
        data.message ||
        "Agency account created. Your workspace is pending approval before dashboard access is enabled.",
    };
  } catch (error: unknown) {
    return rejectWithValue({
      message: getApiMessage(error, "Agency registration failed."),
      fieldErrors: getApiErrors(error),
    });
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await csrf();
      await http.post("/auth/logout");
    } catch {
      return rejectWithValue("Logout failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
      state.fieldErrors = {};
      state.successMessage = null;
      if (state.requestStatus === "error") state.requestStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authMe.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(authMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.authStatus = "authenticated";
        state.requestStatus = "idle";
        state.meChecked = true;
      })
      .addCase(authMe.rejected, (state) => {
        state.user = null;
        state.authStatus = "guest";
        state.requestStatus = "idle";
        state.meChecked = true;
      })
      .addCase(login.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.authStatus = "authenticated";
        state.requestStatus = "idle";
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.authStatus = "guest";
        state.requestStatus = "error";
        state.error = action.payload?.message || "Login failed.";
        state.fieldErrors = action.payload?.fieldErrors ?? {};
      })
      .addCase(registerCustomer.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = null;
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.requestStatus = "idle";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = action.payload.message;
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.requestStatus = "error";
        state.error = action.payload?.message || "Customer registration failed.";
        state.fieldErrors = action.payload?.fieldErrors ?? {};
      })
      .addCase(registerAgency.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = null;
      })
      .addCase(registerAgency.fulfilled, (state, action) => {
        state.requestStatus = "idle";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = action.payload.message;
      })
      .addCase(registerAgency.rejected, (state, action) => {
        state.requestStatus = "error";
        state.error = action.payload?.message || "Agency registration failed.";
        state.fieldErrors = action.payload?.fieldErrors ?? {};
      })
      .addCase(logout.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.authStatus = "guest";
        state.requestStatus = "idle";
        state.error = null;
        state.fieldErrors = {};
        state.successMessage = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.requestStatus = "error";
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
