"use client";

import React from "react";

type ExtrasIntroCardProps = {
  title: string;
  description: string;
};

export default function ExtrasIntroCard({
  title,
  description,
}: ExtrasIntroCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Trip customization
        </div>

        <h2 className="mt-1.5 text-[1.7rem] font-bold tracking-tight text-slate-950 sm:text-[1.9rem]">
          {title}
        </h2>

        <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
          {description}
        </p>
      </div>
    </section>
  );
}
