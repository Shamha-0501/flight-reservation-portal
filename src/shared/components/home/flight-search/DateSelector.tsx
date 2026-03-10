"use client";

import { forwardRef } from "react";
import DatePicker from "react-datepicker";
import Segment from "./ui/Segment";
import type { TripType } from "./types";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const SegmentButtonInput = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; label: string }
>(function SegmentButtonInput({ value, onClick, label }, ref) {
  return (
    <button type="button" ref={ref} onClick={onClick} className="w-full text-left">
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      <div className="mt-1 text-sm text-gray-900">
        {value && value.length ? value : "Add date"}
      </div>
    </button>
  );
});

export default function DateSelector({
  tripType,
  departureDate,
  returnDate,
  onChangeDeparture,
  onChangeReturn,
}: {
  tripType: TripType;
  departureDate: Date | null;
  returnDate: Date | null;
  onChangeDeparture: (v: Date | null) => void;
  onChangeReturn: (v: Date | null) => void;
}) {
  const minDepart = startOfToday();
  const minReturn = departureDate ?? minDepart;

  return (
    <>
      {/* Depart */}
      <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r-2 border-gray-200">
        <Segment>
          <DatePicker
            selected={departureDate}
            onChange={(d: Date | null) => {
              onChangeDeparture(d);
              if (d && returnDate && returnDate < d) onChangeReturn(null);
            }}
            minDate={minDepart}
            dateFormat="EEE, d MMM"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            popperPlacement="bottom-start"
            popperProps={{ strategy: "fixed" }}
            // ✅ avoids clipping without portalId
            popperContainer={({ children }) => <div>{children}</div>}
            customInput={<SegmentButtonInput label="Depart" />}
          />
        </Segment>
      </div>

      {/* Return */}
      {tripType === "roundtrip" && (
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r-2 border-gray-200">
          <Segment>
            <DatePicker
              selected={returnDate}
              onChange={(d: Date | null) => onChangeReturn(d)}
              minDate={minReturn}
              dateFormat="EEE, d MMM"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperPlacement="bottom-start"
              popperProps={{ strategy: "fixed" }}
              popperContainer={({ children }) => <div>{children}</div>}
              customInput={<SegmentButtonInput label="Return" />}
            />
          </Segment>
        </div>
      )}
    </>
  );
}
