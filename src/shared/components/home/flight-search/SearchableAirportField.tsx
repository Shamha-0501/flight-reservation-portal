"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AirportOption,
  formatLocationLabel,
  toTitleCase,
} from "@/src/shared/lib/airports";

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

export default function SearchableAirportField({
  label,
  value,
  options,
  onSelect,
  onQueryChange,
  loading = false,
  inputPaddingClass = "",
}: {
  label: string;
  value: AirportOption | null;
  options: AirportOption[];
  onSelect: (v: AirportOption) => void;

  // remote search
  onQueryChange?: (q: string) => void;
  loading?: boolean;

  inputPaddingClass?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ✅ If using remote search, show options as-is (no extra filtering)
  const remoteMode = Boolean(onQueryChange);

  const shownOptions = useMemo(() => {
    if (remoteMode) return options.slice(0, 10);

    const query = q.trim().toLowerCase();
    if (!query) return options.slice(0, 8);
    return options
      .filter((o) => {
        const hay = `${o.name} ${o.subType} ${o.address?.cityName ?? ""} ${o.iataCode ?? ""} ${o.address?.countryName ?? ""}`.toLowerCase();
        return hay.includes(query);
      })
      .slice(0, 10);
  }, [remoteMode, options, q]);

  // ✅ Show typed text while open; show selected formatted label when closed
  const displayValue = open ? q : value ? formatLocationLabel(value) : "";

  return (
    <div ref={rootRef} className="relative">
      <div className="text-xs font-semibold text-gray-700">{label}</div>

      <input
        value={displayValue}
        onFocus={() => {
          setOpen(true);
          if (!q && value) setQ(formatLocationLabel(value)); // ✅ keep label in input on focus
        }}
        onChange={(e) => {
          const next = e.target.value;
          setOpen(true);
          setQ(next);
          onQueryChange?.(next); // ✅ triggers Amadeus fetch
        }}
        placeholder="City or Airport"
        className={cx(
          "mt-1 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400",
          inputPaddingClass
        )}
      />

      {open && (
        <div
          className="
            absolute left-0 right-0 top-full mt-2
            rounded-xl border border-gray-200 bg-white
            shadow-xl
            max-h-72 overflow-auto
            z-[80]
          "
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : shownOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No results</div>
          ) : (
            shownOptions.map((opt, idx) => (
              <button
                key={`${opt.iataCode}-${opt.subType}-${idx}`}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                  setQ(formatLocationLabel(opt)); // ✅ keep input showing selected label
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
              >
                {/* ✅ Dropdown label in your format */}
                <div className="text-sm font-semibold text-gray-900">
                  {formatLocationLabel(opt)}
                </div>

                {opt.address?.countryName && (
                  <div className="text-xs text-gray-500">
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
