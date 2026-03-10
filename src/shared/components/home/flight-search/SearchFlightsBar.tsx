"use client";

import { useEffect, useState } from "react";
import TripTypeSelector from "./TripTypeSelector";
import SegmentedBar from "./ui/SegmentedBar";
import RouteSelector from "./RouteSelector";
import DateSelector from "./DateSelector";
import PassengerCabinSelector from "./PassengerCabinSelector";
import type { TripType, Passengers, CabinClass } from "./types";
import type { AirportOption } from "./SearchableAirportField";
import { FlightSearchParams } from "@/src/api/types";
import useFlightSearch from "@/src/api/hooks/flightSearch/useFlightSearch";
import { fetchFlights, setFilters } from "@/src/shared/redux/store/flightSearchSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/src/shared/redux/store";

export default function SearchFlightsBar() {
  const dispatch = useDispatch<AppDispatch>();
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState<AirportOption | null>(null);
  const [destination, setDestination] = useState<AirportOption | null>(null);
  // TODO: move searchParams and useFlightSearch in flight search results page later.
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: undefined,
  });

  function onSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  const [passengers, setPassengers] = useState<Passengers>({
    adults: 1,
    children: 0,
    infants: 0,
  });

  const [cabinClass, setCabinClass] = useState<CabinClass>("Economy");

  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);

  function handleTripTypeChange(next: TripType) {
    setTripType(next);
    if (next === "oneway") setReturnDate(null);
  }

  function formatLocalDate(date: Date | null) {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const filter = useSelector((state: any) => state.flightSearch.filters);
  const searchTrigger = useSelector(
    (state: any) => state.flightSearch.searchTrigger,
  );
  useEffect(() => {
    dispatch(
      setFilters({
        origin: origin?.iataCode || "",
        destination: destination?.iataCode || "",
        departureDate: departureDate
          ? formatLocalDate(departureDate)
          : "",
        returnDate: returnDate ? formatLocalDate(returnDate) : "",
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        travelClass: cabinClass
          ? (cabinClass.toUpperCase().replace(/_/g, "_") as
              | "ECONOMY"
              | "PREMIUM_ECONOMY"
              | "BUSINESS"
              | "FIRST")
          : undefined,
      }),
    );
  }, [origin, destination, departureDate, returnDate, passengers, cabinClass]);

  return (
    <div
      className="
        rounded-2xl
        border border-white/25
        bg-white/15
        backdrop-blur-md
        shadow-2xl
        p-4
        overflow-visible
      "
    >
      <div className="mb-3">
        <TripTypeSelector value={tripType} onChange={handleTripTypeChange} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SegmentedBar>
            {/* Route */}
            <RouteSelector
              origin={origin}
              destination={destination}
              onChangeOrigin={setOrigin}
              onChangeDestination={setDestination}
              onSwap={onSwap}
            />

            {/* Dates */}
            <DateSelector
              tripType={tripType}
              departureDate={departureDate}
              returnDate={returnDate}
              onChangeDeparture={setDepartureDate}
              onChangeReturn={setReturnDate}
            />

            {/* Travelers */}
            <PassengerCabinSelector
              passengers={passengers}
              cabinClass={cabinClass}
              onChangePassengers={setPassengers}
              onChangeCabinClass={setCabinClass}
            />
          </SegmentedBar>
        </div>

        <button
          type="button"
          className="
            h-14 lg:h-auto lg:min-h-[72px]
            px-8 rounded-2xl
            bg-blue-600 text-white font-semibold
            hover:bg-blue-700 transition
            w-full lg:w-auto
          "
          onClick={() => dispatch(fetchFlights(filter))}
        >
          Search
        </button>
      </div>
    </div>
  );
}
