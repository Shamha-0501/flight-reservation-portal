"use client";

import React from "react";
import clsx from "clsx";

type BaggageOptionRowProps = {
  label: string;
  price: string;
  description?: string;
  selected?: boolean;
};

export default function BaggageOptionRow({
  label,
  price,
  description,
  selected = false,
}: BaggageOptionRowProps) {
  return (
    <button
      type="button"
      className={clsx(
        "flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50",
        selected && "bg-blue-50/80 shadow-[inset_3px_0_0_0_rgb(37,99,235)]"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={clsx(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-blue-600 bg-blue-600"
              : "border-slate-300 bg-white"
          )}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </span>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          {description && (
            <div className="mt-0.5 text-sm text-slate-500">{description}</div>
          )}
        </div>
      </div>

      <div
        className={clsx(
          "shrink-0 pt-0.5 text-sm font-semibold text-slate-900",
          selected && "text-blue-700"
        )}
      >
        {price}
      </div>
    </button>
  );
}
