"use client";

import FlightCard from "./FlightCard";
import Pagination from "./Pagination";
import type { FlightSearchAppliedFilters } from "@/src/api/types";

type Props = {
  loading: boolean;
  error: string | null;
  data: unknown[] | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  appliedFilters: FlightSearchAppliedFilters;
  onClearAllFilters: () => void;
  onClearDepartureTime: () => void;
  onAllowOneStop: () => void;
};

export default function FlightsResultsList({
  loading,
  error,
  data,
  currentPage,
  totalPages,
  onPageChange,
  appliedFilters,
  onClearAllFilters,
  onClearDepartureTime,
  onAllowOneStop,
}: Props) {
  const hasActiveFilters =
    Boolean(appliedFilters.price?.min != null || appliedFilters.price?.max != null) ||
    Boolean(appliedFilters.stops?.length) ||
    Boolean(appliedFilters.baggage?.length) ||
    Boolean(appliedFilters.airlines?.include?.length) ||
    Boolean(appliedFilters.layoverAirports?.length) ||
    Boolean(appliedFilters.departureTime?.outbound?.min != null) ||
    Boolean(appliedFilters.departureTime?.outbound?.max != null) ||
    Boolean(appliedFilters.refundable) ||
    Boolean(appliedFilters.changeable);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      {loading && <div className="text-sm text-slate-600">Loading...</div>}

      {!loading && !error && data && data.length > 0 && (
        <div className="space-y-5">
          <ul className="space-y-3 text-sm text-slate-700">
            {data.map((offer, index) => (
              <FlightCard
                key={(offer as { id?: string })?.id ?? `offer-${index}`}
                offer={offer as Parameters<typeof FlightCard>[0]["offer"]}
              />
            ))}
          </ul>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            size="md"
          />
        </div>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            No flights match your current filters.
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Try relaxing one filter to see more results.
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClearDepartureTime}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear time filter
              </button>
              <button
                type="button"
                onClick={onAllowOneStop}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Allow 1 stop
              </button>
              <button
                type="button"
                onClick={onClearAllFilters}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
