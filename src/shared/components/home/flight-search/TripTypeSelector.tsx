"use client";

import type { TripType } from "./types";
import PreviewDropdown from "@/src/shared/ui/PreviewDropdown";

const TRIP_TYPE_OPTIONS = [
  { value: "roundtrip", label: "Roundtrip" },
  { value: "oneway", label: "One-way" },
];

export default function TripTypeSelector({
  value,
  onChange,
  tone = "light",
  label,
  layout = "stacked",
}: {
  value: TripType;
  onChange: (v: TripType) => void;
  tone?: "light" | "blue";
  label?: string;
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <div className="flex h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3">
        {label ? (
          <div className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            {label}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <PreviewDropdown
            value={value}
            options={TRIP_TYPE_OPTIONS}
            placeholder="Trip type"
            onChange={(nextValue) => onChange(nextValue as TripType)}
            tone={tone}
            className="h-10 pr-10"
            menuClassName="left-0 right-auto w-full min-w-[180px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {label ? (
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          {label}
        </div>
      ) : null}
      <PreviewDropdown
        value={value}
        options={TRIP_TYPE_OPTIONS}
        placeholder="Trip type"
        onChange={(nextValue) => onChange(nextValue as TripType)}
        tone={tone}
        className="h-14 pr-10"
        menuClassName="left-0 right-auto w-full min-w-[180px]"
      />
    </div>
  );
}
