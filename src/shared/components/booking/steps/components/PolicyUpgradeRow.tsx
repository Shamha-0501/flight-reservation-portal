"use client";

import React from "react";
import clsx from "clsx";

type PolicyUpgradeRowProps = {
  label: string;
  description?: string;
  price: string;
  recommended?: boolean;
  selected: boolean;
  onSelect: () => void;
};

export default function PolicyUpgradeRow({
  label,
  description,
  price,
  recommended = false,
  selected,
  onSelect,
}: PolicyUpgradeRowProps) {
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

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-950">{label}</div>

            {recommended && (
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                Recommended
              </span>
            )}
          </div>

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