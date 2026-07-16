"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightLeft, CalendarDays, Search } from "lucide-react";
import { useAirport } from "@/src/api/hooks/duffel/useAirport";
import TripTypeSelector from "@/src/shared/components/home/flight-search/TripTypeSelector";
import type { TripType } from "@/src/shared/components/home/flight-search/types";
import PreviewDropdown from "@/src/shared/ui/PreviewDropdown";
import {
  AirportOption,
  extractIataCode,
  formatLocationLabel,
  toTitleCase,
} from "@/src/shared/lib/airports";

type SearchForm = {
  tripType: TripType;
  origin: string;
  destination: string;
  depart: string;
  return: string;
  adults: string;
  children: string;
  infants: string;
  travelClass: string;
};

type CabinOption = {
  value: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  label: string;
};

const CABINS: CabinOption[] = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

const CABIN_OPTIONS = CABINS.map((cabin) => ({
  value: cabin.value,
  label: cabin.label,
}));

function InputShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-14 flex-col justify-center rounded-xl border border-white/10 bg-white/5 px-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-white">
        {children}
      </div>
    </div>
  );
}

function AirportField({
  label,
  placeholder,
  value,
  onValueChange,
  onSelect,
  options,
  loading,
}: {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: AirportOption) => void;
  options: AirportOption[];
  loading: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const shownOptions = useMemo(() => options.slice(0, 8), [options]);

  return (
    <div ref={rootRef} className="relative z-40">
      <InputShell label={label}>
        <input
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
        />
      </InputShell>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
          ) : shownOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No results</div>
          ) : (
            shownOptions.map((opt, idx) => (
              <button
                key={`${opt.iataCode}-${opt.subType}-${idx}`}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {formatLocationLabel(opt)}
                </div>
                {opt.address?.countryName && (
                  <div className="text-xs text-slate-500">
                    {toTitleCase(opt.address.countryName)} • {opt.subType}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function PassengersPopover({
  form,
  setForm,
}: {
  form: SearchForm;
  setForm: React.Dispatch<React.SetStateAction<SearchForm>>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const adults = Number(form.adults || 1);
  const children = Number(form.children || 0);
  const infants = Number(form.infants || 0);
  const total = adults + children + infants;
  const cabinLabel = CABINS.find((c) => c.value === form.travelClass)?.label || "Economy";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function setCount(key: "adults" | "children" | "infants", next: number) {
    let nextAdults = adults;
    let nextChildren = children;
    let nextInfants = infants;

    if (key === "adults") nextAdults = next;
    if (key === "children") nextChildren = next;
    if (key === "infants") nextInfants = next;

    nextAdults = clamp(nextAdults, 1, 9);
    nextChildren = clamp(nextChildren, 0, 9);
    nextInfants = clamp(nextInfants, 0, nextAdults);

    setForm((s) => ({
      ...s,
      adults: String(nextAdults),
      children: String(nextChildren),
      infants: String(nextInfants),
    }));
  }

  return (
    <div ref={rootRef} className="relative z-40">
      <InputShell label="Passengers">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left text-sm text-white/90"
        >
          {total} Traveler{total === 1 ? "" : "s"}, {cabinLabel}
        </button>
      </InputShell>

      {open && (
        <div className="absolute right-0 top-full z-[120] mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-slate-900">
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
              Cabin class
            </div>
            <PreviewDropdown
              value={form.travelClass}
              options={CABIN_OPTIONS}
              placeholder="Select cabin"
              onChange={(nextValue) =>
                setForm((s) => ({
                  ...s,
                  travelClass: nextValue,
                }))
              }
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <RowCounter
              title="Adults"
              subtitle="12+ years"
              value={adults}
              onMinus={() => setCount("adults", adults - 1)}
              onPlus={() => setCount("adults", adults + 1)}
              disableMinus={adults <= 1}
            />
            <RowCounter
              title="Children"
              subtitle="2–11 years"
              value={children}
              onMinus={() => setCount("children", children - 1)}
              onPlus={() => setCount("children", children + 1)}
              disableMinus={children <= 0}
            />
            <RowCounter
              title="Infants"
              subtitle="Under 2"
              value={infants}
              onMinus={() => setCount("infants", infants - 1)}
              onPlus={() => setCount("infants", infants + 1)}
              disableMinus={infants <= 0}
              helper={infants >= adults ? "Infants cannot exceed adults." : undefined}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RowCounter({
  title,
  subtitle,
  value,
  onMinus,
  onPlus,
  disableMinus,
  helper,
}: {
  title: string;
  subtitle: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disableMinus?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinus}
            disabled={disableMinus}
            className={`h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 ${
              disableMinus ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
            }`}
          >
            −
          </button>
          <div className="w-6 text-center text-sm font-semibold text-slate-900">{value}</div>
          <button
            type="button"
            onClick={onPlus}
            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
          >
            +
          </button>
        </div>
      </div>
      {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

export default function FlightsSearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripTypeRef = useRef<TripType>("roundtrip");

  const [searchForm, setSearchForm] = useState<SearchForm>({
    tripType: "roundtrip",
    origin: "",
    destination: "",
    depart: "",
    return: "",
    adults: "1",
    children: "0",
    infants: "0",
    travelClass: "ECONOMY",
  });

  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");

  const { airports: originAirports, loading: loadingOrigin } = useAirport(originInput);
  const { airports: destinationAirports, loading: loadingDest } = useAirport(destinationInput);

  const queryString = searchParams.toString();

  useEffect(() => {
    const origin = searchParams.get("from")?.toUpperCase() || "";
    const destination = searchParams.get("to")?.toUpperCase() || "";
    const tripParam = searchParams.get("trip") as TripType | null;
    const returnParam = searchParams.get("return") || "";
    const inferredTrip =
      tripParam === "oneway" || tripParam === "roundtrip"
        ? tripParam
        : returnParam
          ? "roundtrip"
          : "oneway";
    const tripType: TripType = inferredTrip === "oneway" ? "oneway" : "roundtrip";
    const returnValue = tripType === "roundtrip" ? returnParam : "";

    tripTypeRef.current = tripType;
    setSearchForm({
      tripType,
      origin,
      destination,
      depart: searchParams.get("depart") || "",
      return: returnValue,
      adults: searchParams.get("adults") || "1",
      children: searchParams.get("children") || "0",
      infants: searchParams.get("infants") || "0",
      travelClass: searchParams.get("class") || "ECONOMY",
    });

    setOriginInput(origin);
    setDestinationInput(destination);
  }, [queryString]);

  const swapLocations = () => {
    setSearchForm((s) => ({
      ...s,
      origin: s.destination,
      destination: s.origin,
    }));
    setOriginInput(destinationInput);
    setDestinationInput(originInput);
  };

  const handleSearch = () => {
    const q = new URLSearchParams();
    const origin = searchForm.origin || extractIataCode(originInput);
    const destination = searchForm.destination || extractIataCode(destinationInput);
    const tripType = tripTypeRef.current;

    if (origin) q.set("from", origin);
    if (destination) q.set("to", destination);
    if (searchForm.depart) q.set("depart", searchForm.depart);
    q.set("trip", tripType);
    if (tripType === "roundtrip" && searchForm.return) {
      q.set("return", searchForm.return);
    }
    q.set("adults", searchForm.adults || "1");
    if (searchForm.children) q.set("children", searchForm.children);
    if (searchForm.infants) q.set("infants", searchForm.infants);
    if (searchForm.travelClass) q.set("class", searchForm.travelClass);
    router.push(`/flights?${q.toString()}`);
  };

  return (
    <div className="relative z-50 overflow-visible rounded-[20px] border border-white/10 bg-[#16233b]/95 p-4 shadow-xl backdrop-blur">
      <div className="mb-3 flex justify-start">
        <TripTypeSelector
          layout="compact"
          value={searchForm.tripType}
          tone="blue"
          onChange={(next) => {
            tripTypeRef.current = next;
            setSearchForm((s) => ({
              ...s,
              tripType: next,
              return: next === "oneway" ? "" : s.return,
            }));

            const q = new URLSearchParams(searchParams.toString());
            q.set("trip", next);
            if (next === "oneway") {
              q.delete("return");
            }
            router.replace(`/flights?${q.toString()}`);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:items-stretch md:grid-cols-[1.15fr_auto_1.15fr_0.95fr_0.95fr_1.1fr_auto]">
        <AirportField
          label="From"
          placeholder="City or Airport"
          value={originInput}
          onValueChange={(value) => {
            setOriginInput(value);
            const code = extractIataCode(value);
            if (code) setSearchForm((s) => ({ ...s, origin: code }));
          }}
          onSelect={(opt) => {
            const label = formatLocationLabel(opt);
            setOriginInput(label);
            setSearchForm((s) => ({ ...s, origin: opt.iataCode || opt.address?.cityCode || "" }));
          }}
          options={originAirports}
          loading={loadingOrigin}
        />

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={swapLocations}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>

        <AirportField
          label="To"
          placeholder="City or Airport"
          value={destinationInput}
          onValueChange={(value) => {
            setDestinationInput(value);
            const code = extractIataCode(value);
            if (code) setSearchForm((s) => ({ ...s, destination: code }));
          }}
          onSelect={(opt) => {
            const label = formatLocationLabel(opt);
            setDestinationInput(label);
            setSearchForm((s) => ({
              ...s,
              destination: opt.iataCode || opt.address?.cityCode || "",
            }));
          }}
          options={destinationAirports}
          loading={loadingDest}
        />

        <InputShell label="Depart">
          <CalendarDays size={16} className="text-white/55" />
          <input
            type="date"
            className="w-full bg-transparent text-sm text-white outline-none"
            value={searchForm.depart}
            onChange={(e) => setSearchForm((s) => ({ ...s, depart: e.target.value }))}
          />
        </InputShell>

        <InputShell label="Return">
          <CalendarDays size={16} className="text-white/55" />
          <input
            type="date"
            min={searchForm.depart || undefined}
            disabled={searchForm.tripType === "oneway"}
            className={`w-full bg-transparent text-sm text-white outline-none ${
              searchForm.tripType === "oneway" ? "cursor-not-allowed opacity-60" : ""
            }`}
            value={searchForm.return}
            onChange={(e) => setSearchForm((s) => ({ ...s, return: e.target.value }))}
          />
        </InputShell>

        <PassengersPopover form={searchForm} setForm={setSearchForm} />

        <button
          type="button"
          onClick={handleSearch}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary-400 px-5 text-sm font-semibold text-white transition hover:bg-primary-500"
        >
          <Search size={16} />
          Search
        </button>
      </div>
    </div>
  );
}

