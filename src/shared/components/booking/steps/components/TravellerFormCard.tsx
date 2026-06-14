"use client";

import React from "react";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Baby, UserRound, UsersRound } from "lucide-react";
import type { TravellerFormValue } from "../TravellerInfoStep";
import PreviewDropdown from "@/src/shared/ui/PreviewDropdown";

type Traveller = {
  id: string;
  type: "ADULT" | "CHILD" | "INFANT";
  label: string;
  note?: string;
};

type TravellerFormCardProps = {
  traveller: Traveller;
  value: TravellerFormValue;
  errors?: Partial<Record<keyof TravellerFormValue, string>>;
  showErrors?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (field: keyof TravellerFormValue, value: string) => void;
};

const travellerIconMap = {
  ADULT: UserRound,
  CHILD: UsersRound,
  INFANT: Baby,
} as const;

const TITLE_OPTIONS = [
  { value: "mr", label: "Mr." },
  { value: "mrs", label: "Mrs." },
  { value: "ms", label: "Ms." },
  { value: "miss", label: "Miss." },
  { value: "mx", label: "Mx." },
];

const GENDER_OPTIONS = [
  { value: "m", label: "Male" },
  { value: "f", label: "Female" },
];

export default function TravellerFormCard({
  traveller,
  value,
  errors = {},
  showErrors = false,
  isOpen,
  onToggle,
  onChange,
}: TravellerFormCardProps) {
  const TravellerIcon = travellerIconMap[traveller.type];
  const dateOfBirth = value.born_on ? new Date(value.born_on) : null;

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";
  const sectionTitleClass =
    "text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-700";
  const inputErrorClass = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

  const withErrorClass = (field: keyof TravellerFormValue) =>
    clsx(inputClass, showErrors && errors[field] && inputErrorClass);

  return (
    <section
      className={clsx(
        "overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200",
        isOpen
          ? "border-blue-300 shadow-[0_12px_28px_rgba(37,99,235,0.08)]"
          : "border-slate-200"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          "flex w-full items-center justify-between gap-4 text-left transition-all duration-200 sm:px-6",
          isOpen ? "px-5 py-4" : "px-5 py-3.5"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <TravellerIcon size={18} strokeWidth={2.1} />
          </span>

          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-slate-950">
              {traveller.label}
            </div>

            {traveller.note && (
              <div className="mt-1 text-sm text-slate-500">{traveller.note}</div>
            )}
          </div>
        </div>

        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-all duration-200",
            isOpen && "text-blue-600"
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={clsx(
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-5 py-5 sm:px-6">
          <div className="space-y-6">
            <div>
              <div className={sectionTitleClass}>Personal details</div>

              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Title <span className="text-rose-500">*</span></label>
                  <PreviewDropdown
                    value={value.title}
                    options={TITLE_OPTIONS}
                    placeholder="Select title"
                    className={withErrorClass("title")}
                    onChange={(nextValue) => onChange("title", nextValue)}
                  />
                  {showErrors && errors.title ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.title}</p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>First Name <span className="text-rose-500">*</span></label>
                  <input
                    className={withErrorClass("given_name")}
                    placeholder="John"
                    value={value.given_name}
                    onChange={(event) =>
                      onChange("given_name", event.target.value)
                    }
                  />
                  {showErrors && errors.given_name ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.given_name}</p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Last Name <span className="text-rose-500">*</span></label>
                  <input
                    className={withErrorClass("family_name")}
                    placeholder="Doe"
                    value={value.family_name}
                    onChange={(event) =>
                      onChange("family_name", event.target.value)
                    }
                  />
                  {showErrors && errors.family_name ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.family_name}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Gender <span className="text-rose-500">*</span></label>
                  <PreviewDropdown
                    value={value.gender}
                    options={GENDER_OPTIONS}
                    placeholder="Select gender"
                    className={withErrorClass("gender")}
                    onChange={(nextValue) => onChange("gender", nextValue)}
                  />
                  {showErrors && errors.gender ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.gender}</p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Date of Birth <span className="text-rose-500">*</span></label>
                  <DatePicker
                    selected={dateOfBirth}
                    onChange={(date: Date | null) =>
                      onChange("born_on", date ? date.toISOString().slice(0, 10) : "")
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select date of birth"
                    maxDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className={withErrorClass("born_on")}
                    wrapperClassName="block w-full"
                    popperClassName="z-[9999]"
                  />
                  {showErrors && errors.born_on ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.born_on}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/*
              Travel document fields are intentionally hidden for now because
              the backend create-order payload does not accept them yet:
              nationality, passport_number, passport_expiry, issuing_country.
            */}

            <div className="border-t border-slate-200 pt-6">
              <div className={sectionTitleClass}>Frequent flyer</div>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Frequent Flyer Airline</label>
                  <input
                    className={withErrorClass("loyalty_programme_airline")}
                    placeholder="AI"
                    value={value.loyalty_programme_airline}
                    onChange={(event) =>
                      onChange("loyalty_programme_airline", event.target.value)
                    }
                  />
                  {showErrors && errors.loyalty_programme_airline ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.loyalty_programme_airline}</p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Frequent Flyer Number</label>
                  <input
                    className={withErrorClass("loyalty_programme_number")}
                    placeholder="Membership number"
                    value={value.loyalty_programme_number}
                    onChange={(event) =>
                      onChange("loyalty_programme_number", event.target.value)
                    }
                  />
                  {showErrors && errors.loyalty_programme_number ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.loyalty_programme_number}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
