"use client";

import { useMemo, useState } from "react";

type Props = {
  offer: any;
  tags?: string[];
};

function formatDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
}

function formatTimeLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDurationLabel(totalMinutes?: number) {
  if (!totalMinutes || totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatIsoToPretty(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCityLabel(
  iata?: string,
  dict?: Record<string, string>,
  fallback?: string
) {
  if (fallback) return fallback;
  if (iata && dict?.[iata]) return dict[iata];
  return iata || "—";
}

function DetailChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

export default function FlightCard({ offer, tags = [] }: Props) {
  const [expanded, setExpanded] = useState(false);

  const computed = offer.computed ?? {};
  const itineraries = offer.itineraries ?? [];

  const priceTotal =
    computed.grandTotal ?? offer.price?.grandTotal ?? offer.price?.total ?? "—";
  const currency = offer.price?.currency ?? "USD";

  const stops = computed.maxStops ?? 0;
  const stopsLabel =
    stops === 0 ? "Non-stop" : stops === 1 ? "1 stop" : `${stops} stops`;

  const durationMinutes = computed.totalDurationMinutes ?? 0;
  const durationLabel = formatDurationLabel(durationMinutes);

  const carrierCode =
    computed.airlines?.[0] ?? offer.validatingAirlineCodes?.[0] ?? "";
  const carrierName =
    (computed.airlineNames?.[carrierCode] ?? carrierCode) || "Airline";

  const travelerPricing = offer.travelerPricings?.[0] ?? null;
  const fareSegment = travelerPricing?.fareDetailsBySegment?.[0] ?? null;

  const travelClass = fareSegment?.cabin ?? "Economy";
  const brandLabel = fareSegment?.brandedFareLabel ?? null;
  const perPerson = travelerPricing?.price?.total ?? null;

  const checkedBags = computed.baggage?.minCheckedBags ?? null;
  const hasCarryOn = computed.baggage?.hasCarryOn ?? false;
  const refundable =
    computed.refundableAvailable === true ? "Refundable" : "Non-refundable";
  const seatsLeft =
    computed.bookableSeats ?? offer.numberOfBookableSeats ?? null;

  const outboundItinerary = itineraries[0] ?? null;
  const outboundSegments = outboundItinerary?.segments ?? [];

  const firstSeg = outboundSegments[0] ?? null;
  const lastSeg =
    outboundSegments[outboundSegments.length > 0 ? outboundSegments.length - 1 : 0] ??
    null;

  const routeFrom = firstSeg?.departure?.iataCode ?? "—";
  const routeTo = lastSeg?.arrival?.iataCode ?? "—";

  const cityNames = computed.cityNames ?? computed.airportCities ?? {};

  const fromCity = getCityLabel(
    routeFrom,
    cityNames,
    firstSeg?.departure?.cityName ?? firstSeg?.departure?.airportName
  );
  const toCity = getCityLabel(
    routeTo,
    cityNames,
    lastSeg?.arrival?.cityName ?? lastSeg?.arrival?.airportName
  );

  const departAt = formatTimeLabel(firstSeg?.departure?.at);
  const arriveAt = formatTimeLabel(lastSeg?.arrival?.at);
  const departDate = formatDateLabel(firstSeg?.departure?.at);
  const arriveDate = formatDateLabel(lastSeg?.arrival?.at);

  const initials = useMemo(() => {
    const parts = String(carrierName).trim().split(" ");
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [carrierName]);

  return (
    <li className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-blue-700">
            {initials || "FL"}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold uppercase tracking-[0.01em] text-slate-900">
              {carrierName}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {carrierCode || "—"} • {String(travelClass).toUpperCase()}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse details" : "Expand details"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <DetailChip key={tag}>{tag}</DetailChip>
        ))}
        <DetailChip>{refundable}</DetailChip>
        {seatsLeft !== null && <DetailChip>{seatsLeft} left</DetailChip>}
      </div>

      <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-5 sm:px-5">
        <div className="grid grid-cols-[88px_minmax(0,1fr)_88px] items-center gap-3 sm:grid-cols-[120px_minmax(0,1fr)_120px] sm:gap-5">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium text-slate-400 sm:text-xs">
              {fromCity}
            </div>
            <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900 sm:text-[34px]">
              {routeFrom}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-800">{departAt}</div>
            <div className="text-xs text-slate-400">{departDate}</div>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center">
            <div className="relative flex w-full items-center justify-center py-2">
              <svg
                viewBox="0 0 360 70"
                className="h-[54px] w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <circle cx="22" cy="40" r="3.8" fill="#cbd5e1" />
                <path
                  d="M30 40 C 105 8, 255 8, 330 40"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.8"
                  strokeDasharray="4 5"
                  strokeLinecap="round"
                />
                <circle cx="338" cy="40" r="3.8" fill="#cbd5e1" />
              </svg>

              <div className="absolute left-1/2 top-[18px] -translate-x-1/2 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 rotate-45 text-slate-900"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21 16.5l-8.2-3.3-3.2-8.2a1 1 0 0 0-1.9.2l-.9 5.1-5.1.9a1 1 0 0 0-.2 1.9l8.2 3.2 3.3 8.2a1 1 0 0 0 1.9-.2l.9-5.1 5.1-.9a1 1 0 0 0 .2-1.8Z" />
                </svg>
              </div>
            </div>

            <div className="-mt-1 text-center">
              <div className="text-sm font-semibold text-slate-800">
                {durationLabel}
              </div>
              <div className="text-xs text-slate-400">{stopsLabel}</div>
            </div>
          </div>

          <div className="min-w-0 text-right">
            <div className="truncate text-[11px] font-medium text-slate-400 sm:text-xs">
              {toCity}
            </div>
            <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900 sm:text-[34px]">
              {routeTo}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-800">{arriveAt}</div>
            <div className="text-xs text-slate-400">{arriveDate}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-slate-700 sm:text-[13px]">
          <span>{String(travelClass).toUpperCase()}</span>
          <span>{stopsLabel}</span>
          {checkedBags !== null && <span>{checkedBags} checked</span>}
          {hasCarryOn && <span>Carry-on</span>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {brandLabel && <DetailChip>{brandLabel}</DetailChip>}
          {computed.layoverAirports?.length ? (
            <DetailChip>Via {computed.layoverAirports.join(", ")}</DetailChip>
          ) : null}
        </div>

        <div className="flex shrink-0 items-end justify-between gap-4 sm:justify-end">
          <div className="text-right">
            <div className="text-[22px] font-semibold leading-none tracking-tight text-slate-900 sm:text-[24px]">
              {currency} {priceTotal}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {perPerson ? `${currency} ${perPerson} per person` : "Total fare"}
            </div>
          </div>

          <button className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Select Flight
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              {offer.lastTicketingDate && (
                <DetailChip>Ticket by {offer.lastTicketingDate}</DetailChip>
              )}
              {computed.refundableAvailable === true && (
                <DetailChip>Flexible fare</DetailChip>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {itineraries.map((it: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    {i === 0 ? "Outbound" : "Return"} • {it.duration || "—"}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(it.segments ?? []).map((seg: any) => {
                      const depCode = seg.departure?.iataCode ?? "—";
                      const arrCode = seg.arrival?.iataCode ?? "—";
                      const depAt = formatIsoToPretty(seg.departure?.at);
                      const arrAt = formatIsoToPretty(seg.arrival?.at);

                      return (
                        <div
                          key={seg.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800">
                              {depCode} → {arrCode}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {depAt} → {arrAt}
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 md:text-right">
                            {seg.carrierCode} {seg.number}
                            {seg.aircraft?.code ? ` • ${seg.aircraft.code}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}