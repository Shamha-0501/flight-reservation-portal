"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircleFlag } from "react-circle-flags";
import type { RootState } from "../../redux/store";
import { setCurrency } from "../../redux/slices/currencySlice";
import { CURRENCY_OPTIONS } from "../../constants/currencyOptions";
import type { CurrencyOption } from "../../constants/types";
import { ChevronDown } from "lucide-react"; // optional if you use lucide

const LOCAL_STORAGE_KEY = "selectedCurrency";

export const CurrencySelect: React.FC = () => {
  const dispatch = useDispatch();
  const selectedCode = useSelector(
    (state: RootState) => state.currency.selectedCode
  );

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    CURRENCY_OPTIONS.find((opt) => opt.value === selectedCode) ??
    CURRENCY_OPTIONS[0];

  // filter by code / currency name / country name
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCY_OPTIONS;
    return CURRENCY_OPTIONS.filter((opt) => {
      return (
        opt.value.toLowerCase().includes(q) ||
        opt.countryCode.toLowerCase().includes(q) ||
        (opt.countryName ?? "").toLowerCase().includes(q)
      );
    });
  }, [search]);

  const handleSelect = (option: CurrencyOption) => {
    dispatch(setCurrency(option.value));
    setIsOpen(false);
    setSearch("");
  };

  // close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && saved !== selectedCode) {
      dispatch(setCurrency(saved));
    }
    // no selectedCode in deps -> runs only once after mount
  }, [dispatch]);

  return (
    <div ref={wrapperRef} className="relative md:inline-block text-left hidden">
      {/* BUTTON – shows selected flag + code */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-300 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
      >
        <CircleFlag
          countryCode={selectedOption.countryCode}
          width={22}
          height={22}
        />
        <span>{selectedOption.value}</span>

        {/* optional chevron */}
        <span className="ml-1 text-xs text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-70 rounded-2xl bg-white dark:bg-gray-950 shadow-xl ring-1 ring-black/5 z-50">
          {/* search bar */}
          <div className="px-1 pt-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          {/* list */}
          <ul className="mt-2 max-h-72 overflow-y-auto pb-2">
            {filteredOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <CircleFlag
                    countryCode={opt.countryCode}
                    width={22}
                    height={22}
                  />
                  <div className="flex w-full gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-300">
                      {opt.value}
                    </span>
                    <span className="text-sm text-gray-500">
                      {opt.countryName}
                    </span>
                  </div>
                </button>
              </li>
            ))}

            {filteredOptions.length === 0 && (
              <li className="px-3 py-3 text-xs text-gray-400">
                No currencies found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
