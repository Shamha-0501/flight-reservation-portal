"use client";

import React, { useEffect, useRef, useState } from "react";
import BaggageSelectionCard from "./BaggageSelectionCard";
import SeatMapBrowser from "./SeatMapBrowser";
import type { SeatSelectionSummary, TravellerBaggage } from "../ExtrasStep";
import type {
  DuffelSeatMapResponse,
  SeatServiceSelection,
} from "@/src/shared/lib/seatMaps";

type Traveller = {
  id: string;
  label: string;
  type: "ADULT" | "CHILD" | "INFANT";
  note?: string;
};

type FlightExtrasSectionProps = {
  travellers: Traveller[];
  baggageSelections: TravellerBaggage[];
  selectedBaggageByTraveller: Record<string, string>;
  onBaggageSelect: (travellerId: string, optionId: string) => void;
  seatSelection: SeatSelectionSummary;
  seatMaps?: DuffelSeatMapResponse | null;
  seatMapStatus?: string;
  seatMapLoading?: boolean;
  seatMapError?: string | null;
  selectedSeatServices: SeatServiceSelection[];
  onSeatServicesChange: (selection: SeatServiceSelection[]) => void;
};

export default function FlightExtrasSection({
  travellers,
  baggageSelections,
  selectedBaggageByTraveller,
  onBaggageSelect,
  seatSelection,
  seatMaps,
  seatMapStatus,
  seatMapLoading,
  seatMapError,
  selectedSeatServices,
  onSeatServicesChange,
}: FlightExtrasSectionProps) {
  const [isSeatMapOpen, setIsSeatMapOpen] = useState(false);
  const seatMapTriggerRef = useRef<HTMLButtonElement | null>(null);
  const canOpenSeatMap = seatMapStatus === "available" || seatMapStatus === "view_only";
  const seatMapButtonLabel =
    seatMapStatus === "available"
      ? "Choose seats"
      : seatMapStatus === "view_only"
        ? "View seat map"
        : "Seat map unavailable";

  useEffect(() => {
    if (canOpenSeatMap) return;
    setIsSeatMapOpen(false);
  }, [canOpenSeatMap]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Flight extras
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Enhance your journey
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Manage airline-related services for your selected trip.
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                Seat selection
              </div>
              <h4 className="mt-1 text-base font-semibold text-slate-950">
                {seatSelection.title}
              </h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {seatSelection.subtitle}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              {seatMapStatus === "view_only"
                ? "View only"
                : seatSelection.available
                  ? "Available"
                  : "Unavailable"}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm leading-6 text-slate-600">
              {seatMapStatus === "view_only"
                ? "The provider returned a seat map, but some seat services cannot be purchased from this offer."
                : seatMapStatus === "available"
                  ? "Open the seat map in a focused view to select or change seats."
                  : "Seat map access is not available for this offer."}
            </div>

            <button
              type="button"
              ref={seatMapTriggerRef}
              onClick={() => {
                seatMapTriggerRef.current = document.activeElement as HTMLButtonElement | null;
                setIsSeatMapOpen(true);
              }}
              disabled={!canOpenSeatMap || Boolean(seatMapLoading)}
              className={[
                "inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition sm:w-auto",
                canOpenSeatMap && !seatMapLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {seatMapLoading ? "Loading seat map..." : seatMapButtonLabel}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {baggageSelections.map((item) => (
            <BaggageSelectionCard
              key={item.travellerId}
              {...item}
              selectedOptionId={selectedBaggageByTraveller[item.travellerId]}
              onSelect={(optionId) => onBaggageSelect(item.travellerId, optionId)}
            />
          ))}
        </div>

      </div>

      {isSeatMapOpen ? (
        <SeatMapModal
          seatMapStatus={seatMapStatus}
          onClose={() => {
            setIsSeatMapOpen(false);
            window.requestAnimationFrame(() => {
              seatMapTriggerRef.current?.focus();
            });
          }}
        >
          <SeatMapBrowser
            travellers={travellers}
            seatMaps={seatMaps}
            seatMapStatus={seatMapStatus}
            loading={seatMapLoading}
            error={seatMapError}
            selectedSeatServices={selectedSeatServices}
            onSelectionChange={onSeatServicesChange}
          />
        </SeatMapModal>
      ) : null}
    </section>
  );
}

function SeatMapModal({
  children,
  seatMapStatus,
  onClose,
}: {
  children: React.ReactNode;
  seatMapStatus?: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable?.length) return;

      const items = Array.from(focusable);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !modalRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-4">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative z-10 flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Seat map
            </div>

            <h4 className="mt-1 text-base font-bold tracking-tight text-slate-950">
              Seat selection
            </h4>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {seatMapStatus === "view_only"
                ? "You can review the seat layout, but seat purchase is not available for this offer."
                : "Choose a seat and keep the pricing visible while you review the layout."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close seat map"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
