"use client";

import React from "react";

type BaggageInfoBadgeProps = {
  label: string;
};

export default function BaggageInfoBadge({ label }: BaggageInfoBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
      <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}