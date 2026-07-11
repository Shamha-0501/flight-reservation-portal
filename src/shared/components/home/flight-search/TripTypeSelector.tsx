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
}: {
  value: TripType;
  onChange: (v: TripType) => void;
}) {
  return (
    <div className="w-40 max-w-full">
      <PreviewDropdown
        value={value}
        options={TRIP_TYPE_OPTIONS}
        placeholder="Trip type"
        onChange={(nextValue) => onChange(nextValue as TripType)}
        className="
          h-10 w-full rounded-lg
          bg-white text-slate-900
          border border-slate-300
          px-3 pr-10 text-sm
          outline-none
          focus:ring-2 focus:ring-blue-500/30
        "
        menuClassName="left-0 right-auto w-40"
      />
    </div>
  );
}
