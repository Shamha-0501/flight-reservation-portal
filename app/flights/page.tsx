"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  FlightSearchAppliedFilters,
  FlightSearchFilters,
  FlightSearchMeta,
  FlightSearchParams,
} from "@/src/api/types";
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
  const PAGE_SIZE = 10;
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    ReturnType<typeof mapDuffelOfferToFlightViewModel>[] | null
  >(null);
  const [meta, setMeta] = useState<FlightSearchMeta | null>(null);
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);

  const [uiFilters, setUiFilters] = useState<FlightSearchAppliedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FlightSearchAppliedFilters>(EMPTY_FILTERS);

  const [priceMinInput, setPriceMinInput] = useState<string>("");
  const [priceMaxInput, setPriceMaxInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

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
      travelClass: travelClass as FlightSearchParams["travelClass"],
    };
  }, [searchParams]);

  const offersFilters = useMemo<FlightSearchFilters>(() => {
    const hasNonStopOnly = Boolean(appliedFilters.stops?.includes("0"));
    return {
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
      onlyLayovers: hasNonStopOnly ? [] : appliedFilters.layoverAirports,
      refundable: appliedFilters.refundable,
      changeable: appliedFilters.changeable,
    };
  }, [appliedFilters]);

  const hasSearch =
    Boolean(baseSearchParams.origin) &&
    Boolean(baseSearchParams.destination) &&
    Boolean(baseSearchParams.departureDate);

  const isDirty = JSON.stringify(uiFilters) !== JSON.stringify(appliedFilters);
  const totalResults = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const paginatedResults = useMemo(() => {
    if (!data?.length) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [currentPage, data]);

  const handleApplyFilters = () => {
    const hasNonStopOnly = Boolean(uiFilters.stops?.includes("0"));
    setAppliedFilters({
      ...uiFilters,
      layoverAirports: hasNonStopOnly ? [] : uiFilters.layoverAirports,
    });
    setCurrentPage(1);
  };
  const handlePageChange = (nextPage: number) => {
    if (Number.isNaN(nextPage)) return;
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const handleClearFilters = () => {
    setUiFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPriceMinInput("");
    setPriceMaxInput("");
    setCurrentPage(1);
  };
  const handleClearDepartureTime = () => {
    setUiFilters((prev) => ({
      ...prev,
      departureTime: {
        ...prev.departureTime,
        outbound: undefined,
      },
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      departureTime: {
        ...prev.departureTime,
        outbound: undefined,
      },
    }));
    setCurrentPage(1);
  };

  const handleAllowOneStop = () => {
    setUiFilters((prev) => {
      const nextStops = Array.from(new Set([...(prev.stops ?? []), "1"]));
      return {
        ...prev,
        stops: nextStops,
      };
    });
    setAppliedFilters((prev) => {
      const nextStops = Array.from(new Set([...(prev.stops ?? []), "1"])).filter(
        (stop) => stop !== "0"
      ) as Array<"0" | "1" | "2plus">;
      return {
        ...prev,
        stops: nextStops,
      };
    });
    setCurrentPage(1);
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
      setCurrentPage(1);
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
      setCurrentPage(1);
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
      setCurrentPage(1);
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
      setCurrentPage(1);
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
  setCurrentPage(1);
  return;
}
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [offerRequestId, appliedFilters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch flights.");
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
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch flights.");
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

      const styles = {
        best: {
          wrapper:
            "border-blue-100 bg-gradient-to-br from-white to-blue-50/70 shadow-[0_8px_24px_rgba(37,99,235,0.08)]",
          label: "text-blue-600",
          dot: "bg-blue-500",
        },
        cheapest: {
          wrapper:
            "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 shadow-[0_8px_24px_rgba(16,185,129,0.08)]",
          label: "text-emerald-600",
          dot: "bg-emerald-500",
        },
        fastest: {
          wrapper:
            "border-amber-100 bg-gradient-to-br from-white to-amber-50/70 shadow-[0_8px_24px_rgba(245,158,11,0.08)]",
          label: "text-amber-600",
          dot: "bg-amber-500",
        },
      }[key];

      return (
        <div
          key={key}
          className={`group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${styles.wrapper}`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`text-[11px] font-bold uppercase tracking-[0.16em] ${styles.label}`}
            >
              {card.label || key}
            </div>

            <span
              className={`h-2 w-2 rounded-full ${styles.dot}`}
            />
          </div>

          <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
            {card.price?.currency} {card.price?.amount}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>{card.duration?.label}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Stops: {card.stops ?? 0}</span>
          </div>
        </div>
      );
    })}
  </div>
)}

            <FlightsResultsList
              loading={loading}
              error={error}
              data={paginatedResults}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              appliedFilters={appliedFilters}
              onClearAllFilters={handleClearFilters}
              onClearDepartureTime={handleClearDepartureTime}
              onAllowOneStop={handleAllowOneStop}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
