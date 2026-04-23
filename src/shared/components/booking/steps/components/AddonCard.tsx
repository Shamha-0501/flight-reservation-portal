"use client";

import React from "react";
import clsx from "clsx";

type AddonCardProps = {
  title: string;
  description: string;
  price: string;
  icon?: React.ReactNode;
  selected?: boolean;
};

export default function AddonCard({
  title,
  description,
  price,
  icon,
  selected = false,
}: AddonCardProps) {
  return (
    <div
      className={clsx(
        "rounded-3xl border p-4 transition",
        selected
          ? "border-blue-200 bg-blue-50/60"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-700",
              selected ? "bg-blue-100 text-blue-700" : "bg-slate-100"
            )}
          >
            {icon ?? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M12 3L14.8 8.2L20.5 9L16.3 13L17.3 18.7L12 16L6.7 18.7L7.7 13L3.5 9L9.2 8.2L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight text-slate-950">
              {title}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={clsx(
              "text-base font-semibold text-slate-950",
              selected && "text-blue-700"
            )}
          >
            {price}
          </div>
          <button
            type="button"
            className={clsx(
              "mt-3 inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
              selected
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            )}
          >
            {selected ? "Selected" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
