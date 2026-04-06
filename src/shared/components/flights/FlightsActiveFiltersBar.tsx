import type { FlightSearchAppliedFilters } from "@/src/api/types";

type Props = {
  meta: any | null;
  appliedFilters: FlightSearchAppliedFilters;
  onRemove: (type: "price" | "stop" | "baggage" | "airline" | "layoverAirport", value?: string) => void;
  onClearAll: () => void;
};

type Chip = {
  key: string;
  label: string;
  type: "price" | "stop" | "baggage" | "airline" | "layoverAirport";
  value?: string;
};

function getFacetLabel(items: any[] | undefined, key: string) {
  return items?.find((item) => item.key === key)?.label ?? key;
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

