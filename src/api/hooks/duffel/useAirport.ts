import { useEffect, useState } from "react";
import {
  AirportOption,
  DuffelPlace,
  mapPlaceToAirportOption,
} from "@/src/shared/lib/airports";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

export const useAirport = (query: string) => {
  const [airports, setAirports] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const trimmed = query.trim();

    // Debounce typing so we don't hit /api/places on every keystroke.
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setAirports([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchAirports() {
      setLoading(true);
      setError(null);

      try {
        const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN;
        const url = `${apiOrigin}/api/places?q=${encodeURIComponent(debouncedQuery)}`;

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const json = await res.json();

        if (!res.ok) {
          const msg =
            json?.message ||
            json?.error ||
            "Failed to fetch places";

          throw new Error(msg);
        }

        // Keep provider response handling here so the UI only sees AirportOption.
        const mapped = Array.isArray(json?.data)
          ? (json.data as DuffelPlace[])
              .map(mapPlaceToAirportOption)
              .filter((item): item is AirportOption => item !== null)
          : [];

        setAirports(mapped);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err as Error);
        setAirports([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAirports();

    return () => controller.abort();
  }, [debouncedQuery]);

  return { airports, loading, error };
};
