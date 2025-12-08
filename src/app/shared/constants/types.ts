export type CurrencyOption = {
  value: string;       // currency code (LKR, USD, etc.)
  countryCode: string; // ISO 3166-1 alpha-2 for flag ("lk", "us", ...)
  countryName: string;
};

export type CurrencyProps = {
    value?: string;
    onChange?: (currencyCode: string) => void;
};