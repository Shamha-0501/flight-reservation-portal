"use client";

import React from "react";
import clsx from "clsx";

type BaggageOptionRowProps = {
  label: string;
  price: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
};

export default function BaggageOptionRow({
  label,
  price,
  description,
  selected,
  onSelect,
}: BaggageOptionRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "group flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition",
        selected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={clsx(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
            selected
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-transparent group-hover:border-blue-300"
          )}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="M5 10.5L8.5 14L15 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div>
          <div className="text-sm font-semibold text-slate-950">{label}</div>
          {description && (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
        {price}
      </div>
    </button>
  );
}