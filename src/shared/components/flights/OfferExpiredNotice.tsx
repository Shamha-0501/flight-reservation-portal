"use client";

import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";

type Props = {
  href: string;
  label?: string;
  title?: string;
  description?: string;
};

export default function OfferExpiredNotice({
  href,
  label = "Back to search",
  title = "This flight offer has expired",
  description = "Please return to the search results, run the search again, and pick a fresh offer to continue.",
}: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{title}</div>
          <p className="mt-1 text-sm leading-6 text-amber-800">{description}</p>

          <div className="mt-4">
            <Link
              href={href}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              <Search className="h-4 w-4" />
              {label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
