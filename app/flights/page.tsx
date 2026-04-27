"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FlightSearchAppliedFilters, FlightSearchFilters, FlightSearchParams, FlightSearchRequest } from "@/src/api/types";
import {
  createFlightOfferRequest,
  fetchFlightOffers,
} from "@/src/api/routes/flightSearch/search";
import FlightsFilters from "@/src/shared/components/flights/FlightsFilters";
import FlightsResultsList from "@/src/shared/components/flights/FlightsResultsList";
import FlightsSearchBar from "@/src/shared/components/flights/FlightsSearchBar";
import FlightsResultsHeader from "@/src/shared/components/flights/FlightsResultsHeader";
import FlightsActiveFiltersBar from "@/src/shared/components/flights/FlightsActiveFiltersBar";
import { mapDuffelOfferToFlightViewModel } from "@/src/shared/lib/flightsData";

const EMPTY_FILTERS: FlightSearchAppliedFilters = {
  price: undefined,
  stops: [],
  baggage: [],
  airlines: { include: [], exclude: [] },
  layoverAirports: [],
};

export default function FlightsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [meta, setMeta] = useState<any | null>(null);
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);

  const [uiFilters, setUiFilters] = useState<FlightSearchAppliedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FlightSearchAppliedFilters>(EMPTY_FILTERS);

  const [priceMinInput, setPriceMinInput] = useState<string>("");
  const [priceMaxInput, setPriceMaxInput] = useState<string>("");

  const baseSearchParams = useMemo<FlightSearchParams>(() => {
    const origin = searchParams.get("from")?.toUpperCase() || "";
    const destination = searchParams.get("to")?.toUpperCase() || "";
    const departureDate = searchParams.get("depart") || "";
    const tripParam = searchParams.get("trip");
    const returnParam = searchParams.get("return") || "";
    const isRoundTrip =
      tripParam === "roundtrip" ? true : tripParam === "oneway" ? false : Boolean(returnParam);
    const returnDate = isRoundTrip ? returnParam : "";
    const adults = Number(searchParams.get("adults") || 1);
    const children = Number(searchParams.get("children") || 0);
    const infants = Number(searchParams.get("infants") || 0);
    const travelClass = searchParams.get("class") || undefined;

    return {
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      trip: isRoundTrip ? "roundtrip" : "oneway",
      adults,
      children,
      infants,
      travelClass: travelClass as any,
    };
  }, [searchParams]);

  const offersFilters = useMemo<FlightSearchFilters>(() => ({
    minPrice: appliedFilters.price?.min,
    maxPrice: appliedFilters.price?.max,
    stops: appliedFilters.stops,
    baggage: appliedFilters.baggage,
    includeAirlines: appliedFilters.airlines?.include,
    excludeAirlines: appliedFilters.airlines?.exclude,
    outDepartMin: appliedFilters.departureTime?.outbound?.min,
    outDepartMax: appliedFilters.departureTime?.outbound?.max,
    inDepartMin: appliedFilters.departureTime?.inbound?.min,
    inDepartMax: appliedFilters.departureTime?.inbound?.max,
    minDurationMinutes: appliedFilters.totalDuration?.min,
    maxDurationMinutes: appliedFilters.totalDuration?.max,
    onlyLayovers: appliedFilters.layoverAirports,
    refundable: appliedFilters.refundable,
    changeable: appliedFilters.changeable,
  }), [appliedFilters]);

  const hasSearch =
    Boolean(baseSearchParams.origin) &&
    Boolean(baseSearchParams.destination) &&
    Boolean(baseSearchParams.departureDate);

  const isDirty = JSON.stringify(uiFilters) !== JSON.stringify(appliedFilters);

  const handleApplyFilters = () => {
    setAppliedFilters(uiFilters);
  };

  const handleClearFilters = () => {
    setUiFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPriceMinInput("");
    setPriceMaxInput("");
  };

  const handleRemoveFilter = (
    type: "price" | "stop" | "baggage" | "airline" | "layoverAirport",
    value?: string
  ) => {
    if (type === "price") {
      setUiFilters((prev) => ({ ...prev, price: undefined }));
      setAppliedFilters((prev) => ({ ...prev, price: undefined }));
      setPriceMinInput("");
      setPriceMaxInput("");
      return;
    }

    if (type === "stop" && value) {
      setUiFilters((prev) => ({
        ...prev,
        stops: (prev.stops ?? []).filter((item) => item !== value),
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        stops: (prev.stops ?? []).filter((item) => item !== value),
      }));
      return;
    }

    if (type === "baggage" && value) {
      setUiFilters((prev) => ({
        ...prev,
        baggage: (prev.baggage ?? []).filter((item) => item !== value),
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        baggage: (prev.baggage ?? []).filter((item) => item !== value),
      }));
      return;
    }

    if (type === "airline" && value) {
      setUiFilters((prev) => ({
        ...prev,
        airlines: {
          include: (prev.airlines?.include ?? []).filter((item) => item !== value),
          exclude: prev.airlines?.exclude ?? [],
        },
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        airlines: {
          include: (prev.airlines?.include ?? []).filter((item) => item !== value),
          exclude: prev.airlines?.exclude ?? [],
        },
      }));
      return;
    }
    if (type === "layoverAirport" && value) {
  setUiFilters((prev) => ({
    ...prev,
    layoverAirports: (prev.layoverAirports ?? []).filter((item) => item !== value),
  }));
  setAppliedFilters((prev) => ({
    ...prev,
    layoverAirports: (prev.layoverAirports ?? []).filter((item) => item !== value),
  }));
  return;
}
  };

  useEffect(() => {
    const canSearch =
      Boolean(baseSearchParams.origin) &&
      Boolean(baseSearchParams.destination) &&
      Boolean(baseSearchParams.departureDate) &&
      Number(baseSearchParams.adults) >= 1;

    if (!canSearch) {
      setLoading(false);
      setError(null);
      setData(null);
      setMeta(null);
      setOfferRequestId(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setData(null);
      setMeta(null);
      try {
        const nextOfferRequestId = await createFlightOfferRequest(baseSearchParams);
        if (!cancelled) {
          setOfferRequestId(nextOfferRequestId);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to fetch flights.");
          setOfferRequestId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [baseSearchParams]);

  useEffect(() => {
    if (!offerRequestId) {
      return;
    }

    const currentOfferRequestId = offerRequestId;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFlightOffers(currentOfferRequestId, offersFilters);
        if (!cancelled) {
          setData((res.data ?? []).map(mapDuffelOfferToFlightViewModel));
          setMeta(res.meta ?? null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to fetch flights.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [offerRequestId, offersFilters]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-900 text-white">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6">
          <FlightsSearchBar />
        </div>
      </section>

      <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <FlightsFilters
            meta={meta}
            uiFilters={uiFilters}
            setUiFilters={setUiFilters}
            appliedFilters={appliedFilters}
            onApply={handleApplyFilters}
            onClearAll={handleClearFilters}
            isDirty={isDirty}
            priceMinInput={priceMinInput}
            priceMaxInput={priceMaxInput}
            setPriceMinInput={setPriceMinInput}
            setPriceMaxInput={setPriceMaxInput}
          />

          <section className="space-y-4">
            <FlightsResultsHeader
              loading={loading}
              error={error}
              resultCount={data?.length ?? 0}
              hasSearch={hasSearch}
            />

            <FlightsActiveFiltersBar
              meta={meta}
              appliedFilters={appliedFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearFilters}
            />

            {!loading && !error && meta?.summary && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["best", "cheapest", "fastest"] as const).map((key) => {
                  const card = meta.summary?.[key];
                  if (!card) return null;

                  return (
                    <div
                      key={key}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {card.label || key}
                      </div>
                      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                        {card.price?.currency} {card.price?.amount}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {card.duration?.label} • Stops: {card.stops ?? 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <FlightsResultsList loading={loading} error={error} data={data} />
          </section>
        </div>
      </div>
    </main>
  );
}

