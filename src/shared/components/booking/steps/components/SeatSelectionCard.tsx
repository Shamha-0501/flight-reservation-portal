"use client";

import React from "react";

type SeatSelectionCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  available?: boolean;
};

export default function SeatSelectionCard({
  title,
  subtitle,
  ctaLabel,
  available = true,
}: SeatSelectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M7 11V7.5C7 5.6 8.6 4 10.5 4H13.5C15.4 4 17 5.6 17 7.5V11"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M6 11H18L17 20H7L6 11Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold text-slate-950">
                {title}
              </h4>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {available ? "Available" : "Unavailable"}
              </span>
            </div>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!available}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}