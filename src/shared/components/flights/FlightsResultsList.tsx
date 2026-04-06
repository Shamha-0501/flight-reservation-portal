"use client";

import FlightCard from "./FlightCard";

type Props = {
  loading: boolean;
  error: string | null;
  data: any[] | null;
};

export default function FlightsResultsList({ loading, error, data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      {loading && <div className="text-sm text-slate-600">Loading...</div>}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-3 text-sm text-slate-700">
          {data.slice(0, 10).map((offer: any) => (
            <FlightCard key={offer.id} offer={offer} />
          ))}
        </ul>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <div className="text-sm text-slate-500">No results to show.</div>
      )}
    </div>
  );
}
