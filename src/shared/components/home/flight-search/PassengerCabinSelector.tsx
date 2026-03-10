"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Segment from "./ui/Segment";
import type { Passengers, CabinClass } from "./types";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const CABINS: CabinClass[] = ["Economy", "Premium Economy", "Business", "First"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PassengerCabinSelector({
  passengers,
  cabinClass,
  onChangePassengers,
  onChangeCabinClass,
}: {
  passengers: Passengers;
  cabinClass: CabinClass;
  onChangePassengers: (p: Passengers) => void;
  onChangeCabinClass: (c: CabinClass) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const label = useMemo(() => {
    const { adults, children, infants } = passengers;
    const total = adults + children + infants;

    const parts: string[] = [];
    parts.push(`${total} Traveler${total === 1 ? "" : "s"}`);
    parts.push(cabinClass);
    return parts.join(", ");
  }, [passengers, cabinClass]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (!rootRef.current) return;
      const target = e.target as Node;
      if (!rootRef.current.contains(target)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function setCount(key: keyof Passengers, next: number) {
    const nextP = { ...passengers, [key]: next };

    // rules:
    // - adults min 1
    // - infants cannot exceed adults (common airline rule)
    nextP.adults = clamp(nextP.adults, 1, 9);
    nextP.children = clamp(nextP.children, 0, 9);
    nextP.infants = clamp(nextP.infants, 0, nextP.adults);

    onChangePassengers(nextP);
  }

  return (
    <div ref={rootRef} className="relative lg:col-span-2">
      <Segment className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left"
        >
          <div className="text-xs font-semibold text-gray-700">
            Travelers and cabin class
          </div>
          <div className="mt-1 text-sm text-gray-900 truncate">{label}</div>
        </button>

        {/* Popover */}
        <div
          className={cx(
            "absolute left-0 top-full mt-2 w-[320px] z-[60]",
            "rounded-2xl bg-white shadow-xl border border-gray-200",
            "p-4",
            open ? "block" : "hidden"
          )}
        >
          {/* Cabin */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Cabin class
            </div>
            <select
              value={cabinClass}
              onChange={(e) => onChangeCabinClass(e.target.value as CabinClass)}
              className="
                w-full h-10 rounded-xl
                border border-gray-200
                px-3 text-sm text-gray-900
                outline-none
                focus:ring-2 focus:ring-blue-500
              "
            >
              {CABINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Counters */}
          <div className="space-y-3">
            <RowCounter
              title="Adults"
              subtitle="12+ years"
              value={passengers.adults}
              onMinus={() => setCount("adults", passengers.adults - 1)}
              onPlus={() => setCount("adults", passengers.adults + 1)}
              disableMinus={passengers.adults <= 1}
            />
            <RowCounter
              title="Children"
              subtitle="2–11 years"
              value={passengers.children}
              onMinus={() => setCount("children", passengers.children - 1)}
              onPlus={() => setCount("children", passengers.children + 1)}
              disableMinus={passengers.children <= 0}
            />
            <RowCounter
              title="Infants"
              subtitle="Under 2"
              value={passengers.infants}
              onMinus={() => setCount("infants", passengers.infants - 1)}
              onPlus={() => setCount("infants", passengers.infants + 1)}
              disableMinus={passengers.infants <= 0}
              helper={
                passengers.infants >= passengers.adults
                  ? "Infants cannot exceed adults."
                  : undefined
              }
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="
                h-10 px-4 rounded-xl
                bg-blue-600 text-white text-sm font-semibold
                hover:bg-blue-700 transition
              "
            >
              Done
            </button>
          </div>
        </div>
      </Segment>
    </div>
  );
}

function RowCounter({
  title,
  subtitle,
  value,
  onMinus,
  onPlus,
  disableMinus,
  helper,
}: {
  title: string;
  subtitle: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disableMinus?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinus}
            disabled={disableMinus}
            className={cx(
              "h-9 w-9 rounded-full border border-gray-200",
              "flex items-center justify-center",
              disableMinus ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
            )}
          >
            −
          </button>
          <div className="w-6 text-center text-sm font-semibold text-gray-900">
            {value}
          </div>
          <button
            type="button"
            onClick={onPlus}
            className="
              h-9 w-9 rounded-full border border-gray-200
              flex items-center justify-center
              hover:bg-gray-50
            "
          >
            +
          </button>
        </div>
      </div>

      {helper && <div className="mt-1 text-xs text-gray-500">{helper}</div>}
    </div>
  );
}
