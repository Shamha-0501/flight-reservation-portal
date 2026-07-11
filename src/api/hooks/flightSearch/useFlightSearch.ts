import { useCallback } from "react";
import { fetchFlights } from "../../../shared/redux/store/flightSearchSlice";
import { useAppDispatch, useAppSelector } from "../../../shared/redux/store/hooks";
import { FlightSearchParams } from "../../types";

export default function useFlightSearch() {
  const dispatch = useAppDispatch();
  const { filters, loading, error, results } = useAppSelector(
    (state) => state.flightSearch
  );

  const search = useCallback(() => {
    dispatch(fetchFlights(filters));
  }, [dispatch, filters]);

  return {
    filters,
    loading,
    error,
    searchResults: results,
    search,
  };
}