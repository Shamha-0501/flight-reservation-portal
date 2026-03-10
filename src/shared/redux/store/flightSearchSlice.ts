import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { searchFlights } from "../../../api/routes/flightSearch/search";
import { FlightSearchParams } from "../../../api/types";

export interface FlightSearchState {
  filters: FlightSearchParams;
  loading: boolean;
  error: string | null;
  results: any;
}

const initialState: FlightSearchState = {
  filters: {
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: undefined,
  },
  loading: false,
  error: null,
  results: null,
};

export const fetchFlights = createAsyncThunk(
  "flightSearch/fetchFlights",
  async (params: FlightSearchParams, { rejectWithValue }) => {
    try {
      const data = await searchFlights(params);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error?.message || "An error occurred while searching for flights."
      );
    }
  }
);

const flightSearchSlice = createSlice({
  name: "flightSearch",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FlightSearchParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearResults: (state) => {
      state.results = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, resetFilters, clearResults } = flightSearchSlice.actions;
export default flightSearchSlice.reducer;