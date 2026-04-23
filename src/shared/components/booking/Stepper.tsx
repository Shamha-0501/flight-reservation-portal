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
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-5 hidden h-[3px] rounded-full bg-slate-200 md:block">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{
            width:
              steps.length <= 1
                ? "0%"
                : `${(currentStepIndex / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-2">
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
              className={clsx(
                "group flex items-start gap-3 rounded-2xl p-2 text-left transition md:flex-col md:items-center md:rounded-none md:p-0",
                !isDisabled && "cursor-pointer",
                isDisabled && "cursor-not-allowed"
              )}
            >
              <span
                className={clsx(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold transition-all duration-200",
                  isCurrent &&
                    "border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]",
                  isCompleted &&
                    "border-blue-200 bg-white text-blue-600 shadow-sm",
                  isDisabled &&
                    "border-slate-200 bg-slate-100 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
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

              <div className="min-w-0 md:text-center">
                <div
                  className={clsx(
                    "text-[11px] font-semibold uppercase tracking-[0.18em]",
                    isCurrent && "text-blue-600",
                    isCompleted && "text-slate-500",
                    isDisabled && "text-slate-400"
                  )}
                >
                  Step {index + 1}
                </div>

                <div
                  className={clsx(
                    "mt-1 text-sm font-semibold leading-5",
                    isCurrent && "text-slate-950",
                    isCompleted && "text-slate-800",
                    isDisabled && "text-slate-400"
                  )}
                >
                  {step.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}