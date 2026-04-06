"use client";

import type { TripType } from "./types";

export default function TripTypeSelector({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (v: TripType) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TripType)}
      className="
        h-10 w-full rounded-lg
        bg-transparent text-white
        border border-white/35
        px-3 text-sm
        outline-none
        focus:ring-2 focus:ring-white/40
      "
    >
      <option className="text-gray-900" value="roundtrip">
        Roundtrip
      </option>
      <option className="text-gray-900" value="oneway">
        One-way
      </option>
    </select>
  );
}
