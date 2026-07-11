"use client";

import { useEffect, useMemo, useState } from "react";
import Segment from "./ui/Segment";
import SwapButton from "./ui/SwapButton";
import SearchableAirportField from "./SearchableAirportField";
import { useAirport } from "@/src/api/hooks/duffel/useAirport";
import { AirportOption, formatLocationLabel } from "@/src/shared/lib/airports";

export default function RouteSelector({
  origin,
  destination,
  onChangeOrigin,
  onChangeDestination,
  onSwap,
}: {
  origin: AirportOption | null;
  destination: AirportOption | null;
  onChangeOrigin: (v: AirportOption) => void;
  onChangeDestination: (v: AirportOption) => void;
  onSwap: () => void;
}) {
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");

  const { airports: originAirports, loading: loadingOrigin } = useAirport(originQuery);
  const { airports: destinationAirports, loading: loadingDest } = useAirport(destinationQuery);

  // ✅ When selected changes, keep input text synced to your label format
  useEffect(() => {
    if (origin) setOriginQuery(formatLocationLabel(origin));
  }, [origin]);

  useEffect(() => {
    if (destination) setDestinationQuery(formatLocationLabel(destination));
  }, [destination]);

  const originOptions = useMemo(() => originAirports, [originAirports]);
  const destinationOptions = useMemo(() => destinationAirports, [destinationAirports]);

  return (
    <>
      {/* FROM */}
      <div className="lg:col-span-3 relative border-b lg:border-b-0 border-gray-200">
        <div className="hidden lg:block absolute top-0 right-0 h-full w-[2px] bg-gray-200" />

        <Segment className="pr-10">
          <SearchableAirportField
            label="From"
            value={origin}
            options={originOptions}
            onSelect={(v) => {
              onChangeOrigin(v);
              setOriginQuery(formatLocationLabel(v)); // ✅ use airport name + city + iata
            }}
            onQueryChange={setOriginQuery}
            loading={loadingOrigin}
          />
        </Segment>

        <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
          <SwapButton onClick={onSwap} />
        </div>
      </div>

      {/* TO */}
      <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r-2 border-gray-200">
        <Segment className="pl-10">
          <SearchableAirportField
            label="To"
            value={destination}
            options={destinationOptions}
            onSelect={(v) => {
              onChangeDestination(v);
              setDestinationQuery(formatLocationLabel(v));
            }}
            onQueryChange={setDestinationQuery}
            loading={loadingDest}
          />
        </Segment>
      </div>
    </>
  );
}
