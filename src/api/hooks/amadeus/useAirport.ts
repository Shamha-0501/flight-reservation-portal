import { useEffect, useCallback, useState } from "react";
import { getAirports } from "../../routes/amadeus/airport";

export const useAirport = (query: string) => {
  const [airports, setAirports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

    const fetchAirports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAirports(query);
            setAirports(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        if (query.length > 2) {
            fetchAirports();
        } else {
            setAirports([]);
        }
    }, [query, fetchAirports]);

    return { airports, loading, error };
};