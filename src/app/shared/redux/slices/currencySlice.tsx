import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const LOCAL_STORAGE_KEY = "selectedCurrency";

const getInitialCurrency = () => {
  if (typeof window === "undefined") return "LKR";
  const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved || "LKR";
};

export type CurrencyState = {
  selectedCode: string;
};

const initialState: CurrencyState = {
  selectedCode: "LKR", // fixed value on server & client
};

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<string>) {
      state.selectedCode = action.payload;

      // persist on client only
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export const currencyReducer = currencySlice.reducer;

export const persistCurrencyToStorage = (code: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, code);
};
