const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_ORIGIN = trimTrailingSlash(
  (process.env.NEXT_PUBLIC_API_ORIGIN || "").trim()
);
