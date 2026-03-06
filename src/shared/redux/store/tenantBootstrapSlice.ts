// src/store/slices/tenantBootstrapSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "@/src/api/config/http";

type BootstrapResponse = {
  data: {
    tenant: { key: string; name: string };
    theme: {
      mode_default: "light" | "dark";
      tokens: string | { light: any; dark: any };
      custom_css: string | null;
    };
  };
};

type State = {
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  tenant?: { key: string; name: string };
  theme?: {
    mode_default: "light" | "dark";
    tokens?: { light: Record<string, string>; dark: Record<string, string> };
    custom_css?: string | null;
  };
};

const initialState: State = { status: "idle" };

export const fetchTenantBootstrap = createAsyncThunk(
  "tenantBootstrap/fetch",
  async (tenantKey: string, { rejectWithValue }) => {
    try {
      const res = await http.get<BootstrapResponse>("/api/company/bootstrap", {
        params: { tenantKey },
      });

      const tokensRaw = res.data.data.theme.tokens;
      const tokens =
        typeof tokensRaw === "string" ? JSON.parse(tokensRaw) : tokensRaw;

      return {
        tenant: res.data.data.tenant,
        theme: {
          mode_default: res.data.data.theme.mode_default,
          tokens,
          custom_css: res.data.data.theme.custom_css,
        },
      };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Bootstrap request failed";
      return rejectWithValue(message);
    }
  }
);

const slice = createSlice({
  name: "tenantBootstrap",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantBootstrap.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(fetchTenantBootstrap.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.tenant = a.payload.tenant;
        s.theme = a.payload.theme;
      })
      .addCase(fetchTenantBootstrap.rejected, (s, a) => {
        s.status = "failed";
        s.error = (a.payload as string) ?? "Unknown error";
      });
  },
});

export default slice.reducer;
