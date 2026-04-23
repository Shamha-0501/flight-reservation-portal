"use client";

import React from "react";
import Stepper, { StepperStep } from "@/src/shared/components/booking/Stepper";

type BookingLayoutProps = {
  steps: StepperStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export default function BookingLayout({
  steps,
  currentStepIndex,
  onStepChange,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  sidebar,
  children,
}: BookingLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Stepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepChange={onStepChange}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0">{children}</main>

          <aside className="self-start lg:sticky lg:top-28">{sidebar}</aside>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
