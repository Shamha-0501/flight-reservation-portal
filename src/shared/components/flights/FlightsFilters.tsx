"use client";

import type { FlightSearchAppliedFilters } from "@/src/api/types";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ChevronDown,
  Plane,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";

type Props = {
  loading: boolean;
  meta: any | null;
  uiFilters: FlightSearchAppliedFilters;
  setUiFilters: React.Dispatch<React.SetStateAction<FlightSearchAppliedFilters>>;
  appliedFilters: FlightSearchAppliedFilters;
  onApply: () => void;
  onClearAll: () => void;
  isDirty: boolean;
  priceMinInput: string;
  priceMaxInput: string;
  setPriceMinInput: React.Dispatch<React.SetStateAction<string>>;
  setPriceMaxInput: React.Dispatch<React.SetStateAction<string>>;
};

type FilterSectionProps = {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function FilterSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </span>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FilterOptionRow({
  checked,
  disabled,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  count?: number;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
          : checked
          ? "cursor-pointer border-blue-200 bg-blue-50/70"
          : "cursor-pointer border-transparent hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="truncate text-sm text-slate-700">{label}</span>
      </div>

      {typeof count === "number" && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {count}
        </span>
      )}
    </label>
  );
}

function formatCurrency(value: number | undefined, currency = "EUR") {
  if (value == null || Number.isNaN(value)) return "";
  return `${currency} ${value.toLocaleString()}`;
}

export default function FlightsFilters({
  loading,
  meta,
  uiFilters,
  setUiFilters,
  appliedFilters,
  onApply,
  onClearAll,
  isDirty,
  priceMinInput,
  priceMaxInput,
  setPriceMinInput,
  setPriceMaxInput,
}: Props) {
  const [airlineSearch, setAirlineSearch] = useState("");
  const [showAllAirlines, setShowAllAirlines] = useState(false);

  const currency = meta?.summary?.best?.price?.currency || "EUR";
  const priceRangeMin = Number(meta?.ranges?.price?.min ?? 0);
  const priceRangeMax = Number(meta?.ranges?.price?.max ?? 0);

  const [sliderMin, setSliderMin] = useState(priceRangeMin);
  const [sliderMax, setSliderMax] = useState(priceRangeMax);

  useEffect(() => {
    if (!meta?.ranges?.price) return;

    const nextMin =
      priceMinInput !== "" ? Number(priceMinInput) : Number(meta.ranges.price.min);
    const nextMax =
      priceMaxInput !== "" ? Number(priceMaxInput) : Number(meta.ranges.price.max);

    setSliderMin(nextMin);
    setSliderMax(nextMax);
  }, [meta?.ranges?.price, priceMinInput, priceMaxInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setUiFilters((prev) => ({
        ...prev,
        price: {
          min: sliderMin === priceRangeMin ? undefined : sliderMin,
          max: sliderMax === priceRangeMax ? undefined : sliderMax,
        },
      }));

      setPriceMinInput(sliderMin === priceRangeMin ? "" : String(sliderMin));
      setPriceMaxInput(sliderMax === priceRangeMax ? "" : String(sliderMax));
    }, 150);

    return () => clearTimeout(t);
  }, [
    sliderMin,
    sliderMax,
    priceRangeMin,
    priceRangeMax,
    setUiFilters,
    setPriceMinInput,
    setPriceMaxInput,
  ]);

  const selectedCount = useMemo(() => {
    let count = 0;

    if (appliedFilters.price?.min != null || appliedFilters.price?.max != null) count += 1;
    count += appliedFilters.stops?.length ?? 0;
    count += appliedFilters.baggage?.length ?? 0;
    count += appliedFilters.airlines?.include?.length ?? 0;
    count += appliedFilters.layoverAirports?.length ?? 0;

    return count;
  }, [appliedFilters]);

  const filteredAirlines = useMemo(() => {
    const list = meta?.facets?.airlines ?? [];
    const normalizedSearch = airlineSearch.trim().toLowerCase();

    if (!normalizedSearch) return list;

    return list.filter((airline: any) =>
      String(airline.label || "")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [meta?.facets?.airlines, airlineSearch]);

  const visibleAirlines = showAllAirlines ? filteredAirlines : filteredAirlines.slice(0, 6);
  const isNonStopSelected = Boolean(uiFilters.stops?.includes("0"));

  if (loading) {
    return <FlightsFiltersSkeleton />;
  }

  const sliderTrackLeft =
    priceRangeMax > priceRangeMin
      ? ((sliderMin - priceRangeMin) / (priceRangeMax - priceRangeMin)) * 100
      : 0;

  const sliderTrackRight =
    priceRangeMax > priceRangeMin
      ? ((sliderMax - priceRangeMin) / (priceRangeMax - priceRangeMin)) * 100
      : 100;

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="scrollbar-hide rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Filters</div>
                  <div className="mt-0.5 text-xs leading-4 text-slate-500">
                    Narrow down results quickly
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {selectedCount} selected
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all
            </button>

            <button
              type="button"
              onClick={onApply}
              disabled={!isDirty}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
                isDirty
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apply
            </button>
          </div>
        </div>

        {isDirty && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            You have unapplied changes.
          </div>
        )}

        <div className="mt-5 space-y-5">
          <FilterSection
            title="Price"
            icon={<BadgeDollarSign className="h-4 w-4" />}
            defaultOpen
          >
            {meta?.ranges?.price ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="text-xs font-medium text-slate-400">Selected range</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(sliderMin, currency)} - {formatCurrency(sliderMax, currency)}
                  </div>
                </div>

                <div className="px-1">
                  <div className="relative h-10">
                    <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200" />
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-500"
                      style={{
                        left: `${sliderTrackLeft}%`,
                        width: `${sliderTrackRight - sliderTrackLeft}%`,
                      }}
                    />

                    <input
                      type="range"
                      min={priceRangeMin}
                      max={priceRangeMax}
                      step={1}
                      value={sliderMin}
                      onChange={(e) => {
                        const next = Math.min(Number(e.target.value), sliderMax - 1);
                        setSliderMin(next);
                      }}
                      className="pointer-events-none absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md"
                    />

                    <input
                      type="range"
                      min={priceRangeMin}
                      max={priceRangeMax}
                      step={1}
                      value={sliderMax}
                      onChange={(e) => {
                        const next = Math.max(Number(e.target.value), sliderMin + 1);
                        setSliderMax(next);
                      }}
                      className="pointer-events-none absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatCurrency(priceRangeMin, currency)}</span>
                    <span>{formatCurrency(priceRangeMax, currency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">No price range available</div>
            )}
          </FilterSection>

          <FilterSection title="Stops" icon={<Plane className="h-4 w-4" />} defaultOpen>
            {meta?.facets?.stops?.length ? (
              <div className="space-y-1">
                {meta.facets.stops.map((s: any) => {
                  const checked = Boolean(uiFilters.stops?.includes(s.key));
                  const disabled = Number(s.count) === 0;

                  return (
                    <FilterOptionRow
                      key={s.key}
                      checked={checked}
                      disabled={disabled}
                      label={s.label}
                      count={s.count}
                      onChange={(nextChecked) =>
                        setUiFilters((prev) => ({
                          ...prev,
                          stops: nextChecked
                            ? Array.from(new Set([...(prev.stops ?? []), s.key]))
                            : (prev.stops ?? []).filter((k) => k !== s.key),
                          layoverAirports:
                            nextChecked && s.key === "0"
                              ? []
                              : prev.layoverAirports,
                        }))
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-400">No stop data available</div>
            )}
          </FilterSection>

          <FilterSection
            title="Baggage"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            defaultOpen
          >
            {meta?.facets?.baggage?.length ? (
              <div className="space-y-1">
                {meta.facets.baggage.map((b: any) => {
                  const checked = Boolean(uiFilters.baggage?.includes(b.key));
                  const disabled = Number(b.count) === 0;

                  return (
                    <FilterOptionRow
                      key={b.key}
                      checked={checked}
                      disabled={disabled}
                      label={b.label}
                      count={b.count}
                      onChange={(nextChecked) =>
                        setUiFilters((prev) => ({
                          ...prev,
                          baggage: nextChecked
                            ? Array.from(new Set([...(prev.baggage ?? []), b.key]))
                            : (prev.baggage ?? []).filter((k) => k !== b.key),
                        }))
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-400">No baggage data available</div>
            )}
          </FilterSection>

          <FilterSection title="Airlines" icon={<Plane className="h-4 w-4" />} defaultOpen>
            {meta?.facets?.airlines?.length ? (
              <div>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search airline"
                    value={airlineSearch}
                    onChange={(e) => setAirlineSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  />
                </div>

                <div className="scrollbar-hide max-h-72 space-y-1 overflow-auto pr-1">
                  {visibleAirlines.map((a: any) => {
                    const checked = Boolean(uiFilters.airlines?.include?.includes(a.key));
                    const disabled = Number(a.count) === 0;

                    return (
                      <FilterOptionRow
                        key={a.key}
                        checked={checked}
                        disabled={disabled}
                        label={a.label}
                        count={a.count}
                        onChange={(nextChecked) =>
                          setUiFilters((prev) => ({
                            ...prev,
                            airlines: {
                              include: nextChecked
                                ? Array.from(
                                    new Set([...(prev.airlines?.include ?? []), a.key])
                                  )
                                : (prev.airlines?.include ?? []).filter((k) => k !== a.key),
                              exclude: prev.airlines?.exclude ?? [],
                            },
                          }))
                        }
                      />
                    );
                  })}
                </div>

                {filteredAirlines.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAirlines((prev) => !prev)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    {showAllAirlines ? "Show less" : `Show all (${filteredAirlines.length})`}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showAllAirlines ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">No airline data available</div>
            )}
          </FilterSection>

          <FilterSection title="Departure time" icon={<Plane className="h-4 w-4" />}>
  <div className="space-y-3">
    {[
      { label: "Early morning", min: 0, max: 360 },
      { label: "Morning", min: 360, max: 720 },
      { label: "Afternoon", min: 720, max: 1080 },
      { label: "Evening", min: 1080, max: 1440 },
    ].map((slot) => {
      const active =
        uiFilters.departureTime?.outbound?.min === slot.min &&
        uiFilters.departureTime?.outbound?.max === slot.max;

      return (
        <button
          key={slot.label}
          type="button"
          onClick={() =>
            setUiFilters((prev) => ({
              ...prev,
              departureTime: {
                ...prev.departureTime,
                outbound: active ? undefined : slot,
              },
            }))
          }
          className={`w-full rounded-2xl border px-3 py-2 text-sm transition ${
            active
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          {slot.label}
        </button>
      );
    })}
  </div>
</FilterSection>

<FilterSection title="Duration" icon={<Clock className="h-4 w-4" />}>
  {meta?.ranges?.totalDurationMinutes && (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-700">
        {uiFilters.totalDuration?.min ?? meta.ranges.totalDurationMinutes.min}m -
        {uiFilters.totalDuration?.max ?? meta.ranges.totalDurationMinutes.max}m
      </div>

      <input
        type="range"
        min={meta.ranges.totalDurationMinutes.min}
        max={meta.ranges.totalDurationMinutes.max}
        onChange={(e) =>
          setUiFilters((prev) => ({
            ...prev,
            totalDuration: {
              ...prev.totalDuration,
              min: Number(e.target.value),
            },
          }))
        }
      />
    </div>
  )}
</FilterSection>

<FilterSection title="Fare flexibility" icon={<Sparkles className="h-4 w-4" />}>
  <div className="space-y-2">
    <label className="flex items-center justify-between">
      <span className="text-sm text-slate-700">Refundable only</span>
      <input
        type="checkbox"
        checked={uiFilters.refundable || false}
        onChange={(e) =>
          setUiFilters((prev) => ({
            ...prev,
            refundable: e.target.checked || undefined,
          }))
        }
      />
    </label>

    <label className="flex items-center justify-between">
      <span className="text-sm text-slate-700">Changeable only</span>
      <input
        type="checkbox"
        checked={uiFilters.changeable || false}
        onChange={(e) =>
          setUiFilters((prev) => ({
            ...prev,
            changeable: e.target.checked || undefined,
          }))
        }
      />
    </label>
  </div>
</FilterSection>

<FilterSection title="Transit airport" icon={<MapPin className="h-4 w-4" />}>
  {isNonStopSelected && (
    <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
      Transit airport is unavailable while Non-stop is selected.
    </div>
  )}
  {meta?.facets?.layoverAirports?.length ? (
    <div className="scrollbar-hide max-h-72 space-y-1 overflow-auto pr-1">
      {meta.facets.layoverAirports.map((airport: any) => {
        const checked = Boolean(uiFilters.layoverAirports?.includes(airport.key));
        const disabled = isNonStopSelected || Number(airport.count) === 0;

        return (
          <FilterOptionRow
            key={airport.key}
            checked={checked}
            disabled={disabled}
            label={airport.label}
            count={airport.count}
            onChange={(nextChecked) =>
              setUiFilters((prev) => ({
                ...prev,
                layoverAirports: nextChecked
                  ? Array.from(new Set([...(prev.layoverAirports ?? []), airport.key]))
                  : (prev.layoverAirports ?? []).filter((k) => k !== airport.key),
              }))
            }
          />
        );
      })}
    </div>
  ) : (
    <div className="text-sm text-slate-400">No transit airport data available</div>
  )}
</FilterSection>
        </div>
      </div>
    </aside>
  );
}

function FlightsFiltersSkeleton() {
  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="scrollbar-hide rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-9 animate-pulse rounded-xl bg-white" />
            <div className="h-9 animate-pulse rounded-xl bg-blue-200/70" />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between rounded-2xl px-1 py-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="h-4 w-4 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-10 animate-pulse rounded-2xl bg-slate-50" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-50" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
