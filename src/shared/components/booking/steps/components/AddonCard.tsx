"use client";

import React from "react";
import clsx from "clsx";

type AddonCardProps = {
  title: string;
  description: string;
  price: string;
  tag?: string;
  selected: boolean;
  onToggle: () => void;
};

export default function AddonCard({
  title,
  description,
  price,
  tag,
  selected,
  onToggle,
}: AddonCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "group w-full rounded-3xl border p-4 text-left transition",
        selected
          ? "border-blue-300 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.08)]"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition",
              selected
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-600"
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 3L19 6V11C19 15.5 16.2 19.6 12 21C7.8 19.6 5 15.5 5 11V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12L11 14L15.5 9.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold text-slate-950">
                {title}
              </h4>

              {tag && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {tag}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
            {price}
          </div>

          <span
            className={clsx(
              "inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-bold transition",
              selected
                ? "bg-blue-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 group-hover:border-blue-300 group-hover:text-blue-700"
            )}
          >
            {selected ? "Added" : "Add"}
          </span>
        </div>
      </div>
    </button>
  );
}