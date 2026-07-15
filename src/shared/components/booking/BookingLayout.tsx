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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_42%,#ffffff_100%)]">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-10">
          <Stepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepChange={onStepChange}
          />
        </div>
      </header>

      <div className="mx-auto max-w-screen-2xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_392px]">
          <main className="min-w-0 space-y-5">{children}</main>

          <aside className="self-start lg:sticky lg:top-28">{sidebar}</aside>
        </div>
      </div>

      <footer className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
          >
            Back
          </button>

          <div className="hidden text-center text-xs text-slate-500 sm:block">
            Secure checkout · Step {currentStepIndex + 1} of {steps.length}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.30)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
