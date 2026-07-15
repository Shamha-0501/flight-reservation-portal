"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Container from "@/src/shared/ui/Container";
import FlightDetailsSidebar from "@/src/shared/components/booking/FlightDetailsSidebar";
import OfferExpiredNotice from "@/src/shared/components/flights/OfferExpiredNotice";
import { getActiveAgencies, type TenantAgency } from "@/src/api/routes/tenant/agencies";
import { getFlightOfferDetails } from "@/src/api/routes/flightSearch/search";
import {
  mapDuffelOfferToBookingViewModel,
} from "@/src/shared/lib/flightsData";
import { LoadingSkeleton } from "@/src/shared/components/admin/AdminUI";
import { getExpiredOfferMessage, isExpiredOfferMessage } from "@/src/shared/lib/flightOfferErrors";

type DuffelPlace = {
  iata_code?: string;
  city_name?: string;
  name?: string;
};

type DuffelCarrier = {
  iata_code?: string;
  name?: string;
};

type DuffelSegment = {
  id?: string;
  origin?: DuffelPlace;
  destination?: DuffelPlace;
  departing_at?: string;
  arriving_at?: string;
  duration?: string;
  marketing_carrier?: DuffelCarrier;
  operating_carrier?: DuffelCarrier;
  marketing_carrier_flight_number?: string | number;
  operating_carrier_flight_number?: string | number;
};

type DuffelSlice = {
  id?: string;
  origin?: DuffelPlace;
  destination?: DuffelPlace;
  departing_at?: string;
  segments?: DuffelSegment[];
};

type DuffelOffer = Record<string, unknown> & {
  passengers?: unknown[];
  slices?: DuffelSlice[];
  total_amount?: string | number | null;
  total_currency?: string | null;
};

type AgencyMarkupSettings = Record<string, unknown> & {
  markup_type?: "fixed" | "percentage" | null;
  markup_value: number;
  currency?: string | null;
};

type AgentPageFlight = {
  title: string;
  meta: string;
  summaryRoute: string;
  outbound: {
    date: string;
    segments: SidebarSegment[];
  };
  inbound: {
    date: string;
    segments: SidebarSegment[];
  };
  includedBaggage: string;
  basePrice: number;
  currency: string;
};

type SidebarSegment = {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  type: string;
};

const FALLBACK_FLIGHT: AgentPageFlight = {
  title: "Selected flight",
  meta: "Review available agencies for this offer",
  summaryRoute: "-",
  outbound: {
    date: "-",
    segments: [],
  },
  inbound: {
    date: "-",
    segments: [],
  },
  includedBaggage: "Baggage details will be confirmed during booking.",
  basePrice: 0,
  currency: "USD",
};

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId") || "";
  const returnTo = searchParams.get("returnTo") || "/flights";
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const infants = searchParams.get("infants");

  const [agencies, setAgencies] = useState<TenantAgency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [agenciesError, setAgenciesError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<DuffelOffer | null>(null);
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId) {
      setSelectedOffer(null);
      setFlightError("Selected flight was not provided.");
      return;
    }

    let cancelled = false;
    const snapshotKey = `selected-offer:${offerId}`;

    function getStoredOfferSnapshot(): DuffelOffer | null {
      try {
        const raw = window.sessionStorage.getItem(snapshotKey);
        return raw ? (JSON.parse(raw) as DuffelOffer) : null;
      } catch {
        return null;
      }
    }

    async function run() {
      setLoadingFlight(true);
      setFlightError(null);

      try {
        const details = await getFlightOfferDetails(offerId);

        if (!cancelled) {
          setSelectedOffer(details.offer as DuffelOffer);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const fallbackOffer = getStoredOfferSnapshot();

          if (fallbackOffer) {
            setSelectedOffer(fallbackOffer);
            setFlightError(
              getExpiredOfferMessage()
            );
          } else {
            setSelectedOffer(null);
            setFlightError(getErrorMessage(error, "Failed to load selected flight."));
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingFlight(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [offerId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingAgencies(true);
      setAgenciesError(null);

      try {
        const activeAgencies = await getActiveAgencies();

        if (cancelled) return;

        setAgencies(activeAgencies);
      } catch (error: unknown) {
        if (!cancelled) {
          setAgencies([]);
          setAgenciesError(getErrorMessage(error, "Failed to load agencies."));
        }
      } finally {
        if (!cancelled) {
          setLoadingAgencies(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const flight = useMemo(
    () => buildAgentPageFlight(selectedOffer),
    [selectedOffer]
  );

  const buildBookingHref = (agency: TenantAgency) => {
    const nextParams = new URLSearchParams();

    nextParams.set("tenant_key", agency.key);
    nextParams.set("agent_name", agency.name);
    if (offerId) nextParams.set("offerId", offerId);
    if (returnTo) nextParams.set("returnTo", returnTo);
    if (adults) nextParams.set("adults", adults);
    if (children) nextParams.set("children", children);
    if (infants) nextParams.set("infants", infants);

    return `/booking?${nextParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#061b3a] text-white">
        <Container className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <Link href={returnTo} className="flex items-center gap-2 text-white">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to results</span>
            </Link>
            <div />
            <div />
          </div>
          <div className="mt-8">
            <h1 className="text-3xl font-bold">{flight.title}</h1>
            <p className="mt-1 text-sm text-white/80">{flight.meta}</p>
          </div>
        </Container>
      </div>

      <Container className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {loadingFlight ? (
              <LoadingSkeleton />
            ) : null}

            {flightError ? (
              isExpiredOfferMessage(flightError) ? (
                <OfferExpiredNotice href={returnTo} />
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                  {flightError}
                </div>
              )
            ) : null}

            {loadingAgencies ? (
              <LoadingSkeleton />
            ) : null}

            {agenciesError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                {agenciesError}
              </div>
            ) : null}

            {!loadingAgencies && !agenciesError && agencies.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                No active agencies are available right now.
              </div>
            ) : null}

            <div className="grid gap-4">
              {agencies.map((agency) => {
                return (
                  <div
                    key={agency.key}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {agency.name}
                          </h3>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Active agency
                          </span>
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          {agency.meta?.country || agency.timezone || "Travel agency"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Add-ons shown during booking
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {flight.basePrice === null
                            ? formatMoneyValue(null, flight.currency)
                            : formatMoneyValue(
                                flight.basePrice * ((Number(agency.markup?.value ?? 0) + 100) / 100),
                                flight.currency
                              )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Flight fare before optional extras
                        </div>
                        <div className="mt-3">
                          {offerId ? (
                            <Link
                              href={buildBookingHref(agency)}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              Select
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-slate-300 px-4 text-sm font-semibold text-white"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FlightDetailsSidebar
            summaryRoute={flight.summaryRoute}
            outbound={flight.outbound}
            inbound={flight.inbound}
            includedBaggage={flight.includedBaggage}
          />
        </div>
      </Container>
    </div>
  );
}

function buildAgentPageFlight(offer: DuffelOffer | null): AgentPageFlight {
  if (!offer) return FALLBACK_FLIGHT;

  const viewModel = mapDuffelOfferToBookingViewModel(offer);
  const slices = Array.isArray(offer.slices) ? offer.slices : [];
  const passengerCount = Array.isArray(offer.passengers)
    ? Math.max(offer.passengers.length, 1)
    : 1;
  const tripLabel = slices.length > 1 ? "Roundtrip" : "One way";
  const firstSlice = slices[0] ?? null;
  const destinationName =
    getPlaceName(firstSlice?.destination) || viewModel.summary.route;
  const currency = offer.total_currency || "USD";
  const rawBasePrice = offer.total_amount;
  const basePrice = typeof rawBasePrice === "number"
    ? rawBasePrice
    : typeof rawBasePrice === "string"
    ? Number(rawBasePrice)
    : 0;

  return {
    title: destinationName,
    meta: `${passengerCount} traveler${passengerCount === 1 ? "" : "s"} - ${tripLabel} - ${viewModel.summary.stops}`,
    summaryRoute: viewModel.summary.route,
    outbound: buildSliceDetails(slices[0], viewModel.summary.travelDate),
    inbound: buildSliceDetails(slices[1], "No return segment"),
    includedBaggage: viewModel.baggageLabel.replace(/^Included baggage:\s*/i, ""),
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    currency,
  };
}

function buildSliceDetails(
  slice: DuffelSlice | undefined,
  fallbackDate: string
): AgentPageFlight["outbound"] {
  const segments = Array.isArray(slice?.segments) ? slice.segments : [];
  const firstSegmentDeparture = segments[0]?.departing_at ?? slice?.departing_at;

  return {
    date: formatDateLabel(firstSegmentDeparture) || fallbackDate,
    segments: segments.map((segment, index) => {
      const carrier =
        segment.marketing_carrier ?? segment.operating_carrier ?? {};
      const flightNumber =
        segment.marketing_carrier_flight_number ??
        segment.operating_carrier_flight_number ??
        "-";

      return {
        id: segment.id ?? `${slice?.id ?? "slice"}-${index}`,
        airline: carrier.name ?? carrier.iata_code ?? "Airline",
        flightNumber: String(flightNumber),
        from: segment.origin?.iata_code ?? "-",
        to: segment.destination?.iata_code ?? "-",
        departTime: formatTimeLabel(segment.departing_at),
        arriveTime: formatTimeLabel(segment.arriving_at),
        duration: formatDurationLabel(segment.duration),
        type: segments.length === 1 ? "Direct" : "Segment",
      };
    }),
  };
}

function getPlaceName(place?: DuffelPlace) {
  return place?.city_name || place?.name || place?.iata_code || "";
}

function formatDateLabel(iso?: string) {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(iso?: string) {
  if (!iso) return "-";

  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDurationLabel(duration?: string) {
  const minutes = parseDurationToMinutes(duration);

  if (!minutes) return "-";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) return `${hours}h ${remainingMinutes}m`;
  if (hours) return `${hours}h`;
  return `${remainingMinutes}m`;
}

function parseDurationToMinutes(duration?: string) {
  if (!duration) return 0;

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!match) return 0;

  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

function formatMoneyValue(amount: number | null, currency: string) {
  if (amount === null) return "Fare unavailable";

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toNumberOrNull(value: string | number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
