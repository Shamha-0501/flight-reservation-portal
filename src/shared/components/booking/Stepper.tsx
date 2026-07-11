"use client";

import React from "react";
import clsx from "clsx";

export type StepperStep = {
  id: string;
  label: string;
};

type StepperProps = {
  steps: StepperStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
};

export default function Stepper({
  steps,
  currentStepIndex,
  onStepChange,
}: StepperProps) {
  const progress =
    steps.length <= 1 ? 0 : (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <nav aria-label="Booking progress" className="relative">
      <div className="mb-3 flex items-center justify-between md:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            {steps[currentStepIndex]?.label}
          </h2>
        </div>
        <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {Math.round(progress)}%
        </div>
      </div>

      <div className="relative hidden md:block">
        <div className="absolute left-0 right-0 top-5 h-[3px] rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-5 gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isDisabled = index > currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => !isDisabled && onStepChange(index)}
                disabled={isDisabled}
                aria-current={isCurrent ? "step" : undefined}
                className={clsx(
                  "group flex flex-col items-center text-center outline-none transition",
                  !isDisabled && "cursor-pointer",
                  isDisabled && "cursor-not-allowed"
                )}
              >
                <span
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-200",
                    isCurrent &&
                      "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] ring-4 ring-blue-50",
                    isCompleted &&
                      "border-blue-200 bg-white text-blue-600 shadow-sm group-hover:border-blue-300 group-hover:bg-blue-50",
                    isDisabled &&
                      "border-slate-200 bg-slate-100 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                      <path
                        d="M5 10.5L8.5 14L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>

                <span
                  className={clsx(
                    "mt-3 text-[11px] font-semibold uppercase tracking-[0.16em]",
                    isCurrent && "text-blue-600",
                    isCompleted && "text-slate-500",
                    isDisabled && "text-slate-400"
                  )}
                >
                  Step {index + 1}
                </span>

                <span
                  className={clsx(
                    "mt-1 text-sm font-semibold leading-5",
                    isCurrent && "text-slate-950",
                    isCompleted && "text-slate-700",
                    isDisabled && "text-slate-400"
                  )}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:hidden">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
