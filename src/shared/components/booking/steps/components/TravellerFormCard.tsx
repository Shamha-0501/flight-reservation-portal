"use client";

import React, { useState } from "react";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Baby, UserRound, UsersRound } from "lucide-react";
import Select, {
  type SingleValue,
  type StylesConfig,
} from "react-select";
import countryList from "react-select-country-list";

type Traveller = {
  id: string;
  type: "ADULT" | "CHILD" | "INFANT";
  label: string;
  note?: string;
};

type TravellerFormCardProps = {
  traveller: Traveller;
  isOpen: boolean;
  onToggle: () => void;
};

type CountryOption = {
  value: string;
  label: string;
};

const countryOptions = countryList().getData() as CountryOption[];

const travellerIconMap = {
  ADULT: UserRound,
  CHILD: UsersRound,
  INFANT: Baby,
} as const;

export default function TravellerFormCard({
  traveller,
  isOpen,
  onToggle,
}: TravellerFormCardProps) {
  const TravellerIcon = travellerIconMap[traveller.type];
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : null;
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null);
  const [nationality, setNationality] = useState<CountryOption | null>(null);
  const [issuingCountry, setIssuingCountry] = useState<CountryOption | null>(
    null
  );

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";
  const sectionTitleClass =
    "text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-700";
  const selectStyles: StylesConfig<CountryOption, false> = {
    control: (base, state) => ({
      ...base,
      width: "100%",
      minHeight: "44px",
      borderRadius: "0.75rem",
      borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(219, 234, 254, 1)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
      },
    }),
    container: (base) => ({
      ...base,
      width: "100%",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 0.75rem",
    }),
    input: (base) => ({
      ...base,
      margin: "0",
      padding: "0",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#0f172a",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#64748b",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "1rem",
      overflow: "hidden",
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

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

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input className={inputClass} placeholder="John" />
                </div>

                <div>
                  <label className={labelClass}>Last Name</label>
                  <input className={inputClass} placeholder="Doe" />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select className={inputClass} defaultValue="">
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <DatePicker
                    selected={dateOfBirth}
                    onChange={(date: Date | null) => setDateOfBirth(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select date of birth"
                    maxDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className={inputClass}
                    wrapperClassName="block w-full"
                    popperClassName="z-[9999]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className={sectionTitleClass}>Travel document</div>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Nationality</label>
                  <Select
                    options={countryOptions}
                    value={nationality}
                    onChange={(option: SingleValue<CountryOption>) =>
                      setNationality(option ?? null)
                    }
                    placeholder="Select nationality"
                    isSearchable
                    styles={selectStyles}
                    menuPortalTarget={menuPortalTarget}
                    menuPosition="fixed"
                  />
                </div>

                <div>
                  <label className={labelClass}>Passport Number</label>
                  <input className={inputClass} placeholder="N1234567" />
                </div>

                <div>
                  <label className={labelClass}>Passport Expiry</label>
                  <DatePicker
                    selected={passportExpiry}
                    onChange={(date: Date | null) => setPassportExpiry(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select passport expiry"
                    minDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className={inputClass}
                    wrapperClassName="block w-full"
                    popperClassName="z-[9999]"
                  />
                </div>

                <div>
                  <label className={labelClass}>Issuing Country</label>
                  <Select
                    options={countryOptions}
                    value={issuingCountry}
                    onChange={(option: SingleValue<CountryOption>) =>
                      setIssuingCountry(option ?? null)
                    }
                    placeholder="Select issuing country"
                    isSearchable
                    styles={selectStyles}
                    menuPortalTarget={menuPortalTarget}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
