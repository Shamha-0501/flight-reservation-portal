"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/src/shared/ui/Container";
import FlightDetailsSidebar from "@/src/shared/components/booking/FlightDetailsSidebar";
import { getActiveAgencies, type TenantAgency } from "@/src/api/routes/tenant/agencies";
import { getTenantAddonSettings } from "@/src/api/routes/tenant/extras";
import { getFlightOfferDetails } from "@/src/api/routes/flightSearch/search";
import {
  mapDuffelOfferToBookingViewModel,
} from "@/src/shared/lib/flightsData";
import {
  mapTenantSettingsToAddons,
  mapTenantSettingsToPolicies,
  type TenantAddonSettings,
} from "@/src/shared/lib/tenantAddonSettings";

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
  basePrice: number | null;
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
  basePrice: null,
  currency: "USD",
};

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId") || "";
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const infants = searchParams.get("infants");

  const [agencies, setAgencies] = useState<TenantAgency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [agenciesError, setAgenciesError] = useState<string | null>(null);
  const [extrasByAgencyKey, setExtrasByAgencyKey] = useState<
    Record<string, TenantAddonSettings | null>
  >({});
  const [extrasErrorsByAgencyKey, setExtrasErrorsByAgencyKey] = useState<
    Record<string, string>
  >({});
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
              "Live fare confirmation is temporarily unavailable. Showing the selected flight snapshot."
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
      setExtrasByAgencyKey({});
      setExtrasErrorsByAgencyKey({});

      try {
        const activeAgencies = await getActiveAgencies();

        if (cancelled) return;

        setAgencies(activeAgencies);
        setLoadingAgencies(false);

        if (!activeAgencies.length) {
          return;
        }

        setLoadingExtras(true);

        const extrasResults = await Promise.all(
          activeAgencies.map(async (agency) => {
            try {
              const settings = await getTenantAddonSettings(agency.key);
              return { agencyKey: agency.key, settings, error: null };
            } catch (error: unknown) {
              return {
                agencyKey: agency.key,
                settings: null,
                error: getErrorMessage(error, "Failed to load agency extras."),
              };
            }
          })
        );

        if (cancelled) return;

        const nextExtrasByAgencyKey: Record<string, TenantAddonSettings | null> = {};
        const nextExtrasErrorsByAgencyKey: Record<string, string> = {};

        extrasResults.forEach((result) => {
          nextExtrasByAgencyKey[result.agencyKey] = result.settings;

          if (result.error) {
            nextExtrasErrorsByAgencyKey[result.agencyKey] = result.error;
          }
        });

        setExtrasByAgencyKey(nextExtrasByAgencyKey);
        setExtrasErrorsByAgencyKey(nextExtrasErrorsByAgencyKey);
      } catch (error: unknown) {
        if (!cancelled) {
          setAgencies([]);
          setAgenciesError(getErrorMessage(error, "Failed to load agencies."));
        }
      } finally {
        if (!cancelled) {
          setLoadingAgencies(false);
          setLoadingExtras(false);
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
            <Link href="/flights" className="flex items-center gap-2 text-white">
              <span className="text-base">&larr;</span> Back to results
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
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Loading selected flight...
              </div>
            ) : null}

            {flightError ? (
              <div
                className={`rounded-2xl border p-5 text-sm ${
                  selectedOffer
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {flightError}
              </div>
            ) : null}

            {loadingAgencies ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Loading agencies...
              </div>
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
                const settings = extrasByAgencyKey[agency.key];
                const extrasError = extrasErrorsByAgencyKey[agency.key];
                const extrasPreview = getAgencyExtrasPreview(settings);

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
                          {loadingExtras && !settings && !extrasError ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Loading extras
                            </span>
                          ) : extrasError ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Extras unavailable
                            </span>
                          ) : extrasPreview.length ? (
                            extrasPreview.slice(0, 4).map((extra) => (
                              <span
                                key={extra}
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                              >
                                {extra}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              No agency extras configured
                            </span>
                          )}

                          {extrasPreview.length > 4 ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              +{extrasPreview.length - 4} more
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {formatMoneyValue(flight.basePrice, flight.currency)}
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
  const basePrice = toNumberOrNull(offer.total_amount);

  return {
    title: destinationName,
    meta: `${passengerCount} traveler${passengerCount === 1 ? "" : "s"} - ${tripLabel} - ${viewModel.summary.stops}`,
    summaryRoute: viewModel.summary.route,
    outbound: buildSliceDetails(slices[0], viewModel.summary.travelDate),
    inbound: buildSliceDetails(slices[1], "Not included"),
    includedBaggage: viewModel.baggageLabel.replace(/^Included baggage:\s*/i, ""),
    basePrice,
    currency,
  };
}

function buildSliceDetails(
  slice: DuffelSlice | undefined,
  fallbackDate: string
): AgentPageFlight["outbound"] {
  const segments = Array.isArray(slice?.segments) ? slice.segments : [];

  return {
    date: formatDateLabel(slice?.departing_at) || fallbackDate,
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

function getAgencyExtrasPreview(settings?: TenantAddonSettings | null) {
  if (!settings) return [];

  return [
    ...mapTenantSettingsToPolicies(settings).flatMap((group) =>
      group.upgrades.map((upgrade) => upgrade.label)
    ),
    ...mapTenantSettingsToAddons(settings).map((addon) => addon.title),
  ];
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
