import type { FlightSearchAppliedFilters } from "@/src/api/types";

type Props = {
  meta: any | null;
  appliedFilters: FlightSearchAppliedFilters;
  onRemove: (
    type:
      | "price"
      | "stop"
      | "baggage"
      | "airline"
      | "layoverAirport"
      | "departureTime"
      | "refundable"
      | "changeable",
    value?: string
  ) => void;
  onClearAll: () => void;
};

type Chip = {
  key: string;
  label: string;
  type:
    | "price"
    | "stop"
    | "baggage"
    | "airline"
    | "layoverAirport"
    | "departureTime"
    | "refundable"
    | "changeable";
  value?: string;
};

function getFacetLabel(items: any[] | undefined, key: string) {
  return items?.find((item) => item.key === key)?.label ?? key;
}

function minutesToLabel(minutes: number) {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getTimeRangeLabel(range?: { min?: number; max?: number }) {
  if (!range) return null;
  if (range.min == null && range.max == null) return null;

  const minLabel = range.min != null ? minutesToLabel(range.min) : "Any";
  const maxLabel = range.max != null ? minutesToLabel(range.max) : "Any";

  return `${minLabel} - ${maxLabel}`;
}

export default function FlightsActiveFiltersBar({
  meta,
  appliedFilters,
  onRemove,
  onClearAll,
}: Props) {
  const chips: Chip[] = [];

  if (appliedFilters.price?.min != null || appliedFilters.price?.max != null) {
    const currency = meta?.summary?.best?.price?.currency || "EUR";
    const min = appliedFilters.price?.min != null ? appliedFilters.price.min : "Any";
    const max = appliedFilters.price?.max != null ? appliedFilters.price.max : "Any";
    chips.push({
      key: "price",
      type: "price",
      label: `Price: ${currency} ${min} - ${max}`,
    });
  }

  (appliedFilters.stops ?? []).forEach((stopKey) => {
    chips.push({
      key: `stop-${stopKey}`,
      type: "stop",
      value: stopKey,
      label: getFacetLabel(meta?.facets?.stops, stopKey),
    });
  });

  (appliedFilters.baggage ?? []).forEach((baggageKey) => {
    chips.push({
      key: `baggage-${baggageKey}`,
      type: "baggage",
      value: baggageKey,
      label: getFacetLabel(meta?.facets?.baggage, baggageKey),
    });
  });

  (appliedFilters.airlines?.include ?? []).forEach((airlineKey) => {
    chips.push({
      key: `airline-${airlineKey}`,
      type: "airline",
      value: airlineKey,
      label: getFacetLabel(meta?.facets?.airlines, airlineKey),
    });
  });
  (appliedFilters.layoverAirports ?? []).forEach((airportKey) => {
    chips.push({
      key: `layover-${airportKey}`,
      type: "layoverAirport",
      value: airportKey,
      label: getFacetLabel(meta?.facets?.layoverAirports, airportKey),
    });
  });

  const outboundRange = getTimeRangeLabel(appliedFilters.departureTime?.outbound);
  if (outboundRange) {
    chips.push({
      key: "departure-outbound",
      type: "departureTime",
      value: "outbound",
      label: `Departure: ${outboundRange}`,
    });
  }

  const inboundRange = getTimeRangeLabel(appliedFilters.departureTime?.inbound);
  if (inboundRange) {
    chips.push({
      key: "departure-inbound",
      type: "departureTime",
      value: "inbound",
      label: `Return: ${inboundRange}`,
    });
  }

  if (appliedFilters.refundable) {
    chips.push({
      key: "refundable",
      type: "refundable",
      label: "Refundable only",
    });
  }

  if (appliedFilters.changeable) {
    chips.push({
      key: "changeable",
      type: "changeable",
      label: "Changeable only",
    });
  }

  if (!chips.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Active filters
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => onRemove(chip.type, chip.value)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <span>{chip.label}</span>
                <span className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="self-start rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

