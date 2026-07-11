"use client";

"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Plane } from "lucide-react";

type Props = {
  offer: FlightCardOffer;
  tags?: string[];
};

type FlightCardOffer = {
  id?: string;
  computed?: {
    grandTotal?: string | number;
    maxStops?: number;
    totalDurationMinutes?: number;
    airlines?: string[];
    airlineNames?: Record<string, string>;
    cityNames?: Record<string, string>;
    airportCities?: Record<string, string>;
    baggage?: {
      minCheckedBags?: number | null;
      hasCarryOn?: boolean;
    };
    refundableAvailable?: boolean;
    bookableSeats?: number | null;
    layoverAirports?: string[];
  };
  itineraries?: FlightItinerary[];
  price?: {
    grandTotal?: string | number;
    total?: string | number;
    currency?: string;
  };
  validatingAirlineCodes?: string[];
  owner?: {
    logo_symbol_url?: string | null;
    logo_lockup_url?: string | null;
    iata_code?: string;
    name?: string;
  };
  travelerPricings?: Array<{
    price?: { total?: string | number | null };
    fareDetailsBySegment?: Array<{
      cabin?: string;
      brandedFareLabel?: string | null;
    }>;
  }>;
  numberOfBookableSeats?: number | null;
  lastTicketingDate?: string | null;
};

type FlightItinerary = {
  duration?: string | number;
  segments?: FlightSegment[];
};

type FlightSegment = {
  id?: string;
  departure?: {
    iataCode?: string;
    cityName?: string;
    airportName?: string;
    at?: string;
  };
  arrival?: {
    iataCode?: string;
    cityName?: string;
    airportName?: string;
    at?: string;
  };
  carrierCode?: string;
  number?: string | number;
  aircraft?: {
    code?: string;
  };
};

function formatDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function formatTimeLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

function IconPlane({ className = "h-4 w-4" }) {
  return <Plane className={className} />;
}

function IconSeat() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4v7a4 4 0 0 0 4 4h6" />
      <path d="M5 20h14" />
      <path d="M7 11l-2 9" />
      <path d="M11 15l-1 5" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      <rect x="5" y="8" width="14" height="12" rx="2" />
      <path d="M9 12v4M15 12v4" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 13l-7 7-9-9V4h7l9 9Z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function FlightCard({ offer, tags = [] }: Props) {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const computed = offer.computed ?? {};
  const itineraries = offer.itineraries ?? [];

  const priceTotal =
    computed.grandTotal ?? offer.price?.grandTotal ?? offer.price?.total ?? "—";
  const currency = offer.price?.currency ?? "USD";

  const stops = computed.maxStops ?? 0;
  const stopsLabel =
    stops === 0 ? "Non-stop" : stops === 1 ? "1 stop" : `${stops} stops`;

  const durationLabel = formatDurationLabel(computed.totalDurationMinutes ?? 0);

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
  const airlineLogoUrl =
    offer.owner?.logo_symbol_url ?? offer.owner?.logo_lockup_url ?? null;

  const agentsHref = useMemo(() => {
    const nextParams = new URLSearchParams();
    const adults = searchParams.get("adults");
    const children = searchParams.get("children");
    const infants = searchParams.get("infants");

    if (offer.id) nextParams.set("offerId", offer.id);
    if (adults) nextParams.set("adults", adults);
    if (children) nextParams.set("children", children);
    if (infants) nextParams.set("infants", infants);

    return `/flights/agents?${nextParams.toString()}`;
  }, [offer.id, searchParams]);

  const handleSelectFlight = () => {
    if (!offer.id) return;

    try {
      window.sessionStorage.setItem(
        `selected-offer:${offer.id}`,
        JSON.stringify(offer)
      );
    } catch {}

  };

  return (
    <li className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_36px_rgba(15,23,42,0.09)] sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)_250px] lg:items-stretch">
        <div className="flex flex-col justify-between gap-5 border-slate-200 lg:border-r lg:pr-6">
          <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-lg font-bold text-blue-700">
            {airlineLogoUrl && !logoFailed ? (
              <Image
                src={airlineLogoUrl}
                alt={`${carrierName} logo`}
                className="h-12 w-12 object-contain"
                width={48}
                height={48}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              initials || "FL"
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold uppercase text-slate-950">
              {carrierName}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {carrierCode || "—"} • {String(travelClass).toUpperCase()}
            </div>

          </div>
          </div>

            <div className="flex flex-wrap gap-2">
              <DetailChip>{refundable}</DetailChip>
              {brandLabel && <DetailChip>{brandLabel}</DetailChip>}
              {tags.map((tag) => (
                <DetailChip key={tag}>{tag}</DetailChip>
              ))}
            </div>
        </div>

        <div className="min-w-0 border-slate-200 lg:pr-6">
          <div className="grid grid-cols-[90px_minmax(0,1fr)_90px] items-center gap-3 sm:grid-cols-[130px_minmax(0,1fr)_130px]">
            <div>
              <div className="truncate text-xs font-medium text-slate-400">
                {fromCity}
              </div>
              <div className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-slate-950">
                {routeFrom}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {departAt}
              </div>
              <div className="text-xs text-slate-400">{departDate}</div>
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                <svg
                  viewBox="0 0 360 48"
                  className="h-10 w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <circle cx="22" cy="28" r="4" fill="#cbd5e1" />
                  <path
                    d="M30 28 C 105 5, 255 5, 330 28"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.8"
                    strokeDasharray="5 6"
                    strokeLinecap="round"
                  />
                  <circle cx="338" cy="28" r="4" fill="#cbd5e1" />
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-100">
                  <IconPlane className="h-4 w-4 rotate-45 text-slate-950" />
                </div>
              </div>

              <div className="mt-1 text-center">
                <div className="text-sm font-semibold text-slate-900">
                  {durationLabel}
                </div>
                <div className="text-xs text-slate-400">{stopsLabel}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="truncate text-xs font-medium text-slate-400">
                {toCity}
              </div>
              <div className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-slate-950">
                {routeTo}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {arriveAt}
              </div>
              <div className="text-xs text-slate-400">{arriveDate}</div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <IconSeat />
              {String(travelClass)}
            </span>

            {checkedBags !== null && (
              <span className="inline-flex items-center gap-2">
                <IconBag />
                {checkedBags} checked
              </span>
            )}

            {hasCarryOn && (
              <span className="inline-flex items-center gap-2">
                <IconBag />
                Carry-on
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-4 border-slate-200 lg:flex-col lg:items-center lg:justify-between lg:border-l lg:pl-6">
          <div className="text-left lg:text-center">
            <div className="text-[26px] font-semibold leading-none tracking-tight text-slate-950">
              {currency} {priceTotal}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {perPerson ? `${currency} ${perPerson} per person` : "Total fare"}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:flex-col">
            <Link
              href={agentsHref}
              onClick={handleSelectFlight}
              className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Select Flight
            </Link>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse details" : "Expand details"}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${
                  expanded ? "rotate-180" : "rotate-0"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              {offer.lastTicketingDate && (
                <DetailChip>Ticket by {offer.lastTicketingDate}</DetailChip>
              )}
              {computed.refundableAvailable === true && (
                <DetailChip>Flexible fare</DetailChip>
              )}
              {computed.layoverAirports?.length ? (
                <DetailChip>Via {computed.layoverAirports.join(", ")}</DetailChip>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              {itineraries.map((it, i) => (
                <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-base font-semibold text-slate-950">
                    {i === 0 ? "Outbound" : "Inbound"} • {it.duration || "—"}
                  </div>

                  <div className="mt-4 space-y-3">
                    {(it.segments ?? []).map((seg) => {
                      const depCode = seg.departure?.iataCode ?? "—";
                      const arrCode = seg.arrival?.iataCode ?? "—";
                      const depAt = formatIsoToPretty(seg.departure?.at);
                      const arrAt = formatIsoToPretty(seg.arrival?.at);

                      return (
                        <div
                          key={seg.id ?? `${depCode}-${arrCode}-${depAt}`}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {depCode} → {arrCode}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {depAt} – {arrAt}
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

            <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-slate-200 lg:gap-0">
              <div className="flex items-center gap-3 px-2 py-1 lg:px-4">
                <IconClock />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {durationLabel}
                  </div>
                  <div className="text-xs text-slate-500">Duration</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 py-1 lg:px-4">
                <IconPlane />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {stopsLabel}
                  </div>
                  <div className="text-xs text-slate-500">Stops</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 py-1 lg:px-4">
                <IconTag />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {String(travelClass)}
                  </div>
                  <div className="text-xs text-slate-500">Cabin</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 py-1 lg:px-4">
                <IconCalendar />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {refundable}
                  </div>
                  <div className="text-xs text-slate-500">Fare type</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 py-1 lg:px-4">
                <IconSeat />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {seatsLeft !== null ? `${seatsLeft} left` : "Available"}
                  </div>
                  <div className="text-xs text-slate-500">Bookable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
