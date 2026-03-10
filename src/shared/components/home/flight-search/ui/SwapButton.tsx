"use client";

import { ArrowLeftRight } from "lucide-react";

export default function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        h-11 w-11
        rounded-full
        bg-white
        border-2 border-gray-200
        shadow-md
        flex items-center justify-center
        hover:bg-gray-50 transition
      "
      aria-label="Swap origin and destination"
      title="Swap"
    >
      <ArrowLeftRight className="h-5 w-5 text-gray-800" />
    </button>
  );
}
