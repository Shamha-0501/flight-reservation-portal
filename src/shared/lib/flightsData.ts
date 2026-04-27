function parseDurationToMinutes(duration?: string) {
  if (!duration) return 0;

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);

  return (hours * 60) + minutes;
}

function mapDuffelBaggage(offer: any) {
  const passengerBaggages = (offer.slices ?? [])
    .flatMap((slice: any) => slice.segments ?? [])
    .flatMap((segment: any) => segment.passengers ?? [])
    .flatMap((passenger: any) => passenger.baggages ?? []);

  const checkedQuantities = passengerBaggages
    .filter((bag: any) => bag?.type === "checked")
    .map((bag: any) => Number(bag?.quantity ?? 0))
    .filter((quantity: number) => quantity > 0);

  const carryOnQuantities = passengerBaggages
    .filter((bag: any) => bag?.type === "carry_on")
    .map((bag: any) => Number(bag?.quantity ?? 0))
    .filter((quantity: number) => quantity > 0);

  const fallback = offer.computed?.baggage ?? {};

  return {
    hasChecked:
      checkedQuantities.length > 0 || Boolean(fallback.hasChecked),
    hasCarryOn:
      carryOnQuantities.length > 0 || Boolean(fallback.hasCarryOn),
    minCheckedBags:
      checkedQuantities.length > 0
        ? Math.min(...checkedQuantities)
        : Number(fallback.minCheckedBags ?? 0),
    minCarryOnBags:
      carryOnQuantities.length > 0 ? Math.min(...carryOnQuantities) : 0,
  };
}

export function mapDuffelOfferToFlightViewModel(offer: any) {
  const airlineNames: Record<string, string> = {};

  const itineraries = (offer.slices ?? []).map((slice: any) => ({
    duration: parseDurationToMinutes(slice.duration),
    segments: (slice.segments ?? []).map((segment: any) => ({
      id: segment.id,
      departure: {
        iataCode: segment.origin?.iata_code,
        cityName: segment.origin?.city_name,
        airportName: segment.origin?.name,
        at: segment.departing_at,
      },
      arrival: {
        iataCode: segment.destination?.iata_code,
        cityName: segment.destination?.city_name,
        airportName: segment.destination?.name,
        at: segment.arriving_at,
      },
      carrierCode:
        segment.marketing_carrier?.iata_code ??
        segment.operating_carrier?.iata_code,
      number:
        segment.marketing_carrier_flight_number ??
        segment.operating_carrier_flight_number,
      aircraft: segment.aircraft
        ? {
            code: segment.aircraft.iata_code,
            name: segment.aircraft.name,
          }
        : undefined,
    })),
  }));

  (offer.slices ?? []).forEach((slice: any) => {
    (slice.segments ?? []).forEach((segment: any) => {
      const code =
        segment.marketing_carrier?.iata_code ??
        segment.operating_carrier?.iata_code;
      const name =
        segment.marketing_carrier?.name ??
        segment.operating_carrier?.name;

      if (code && name) {
        airlineNames[String(code).toUpperCase()] = String(name);
      }
    });
  });

  const firstPassenger = offer.passengers?.[0] ?? null;
  const firstSegmentPassenger =
    offer.slices?.[0]?.segments?.[0]?.passengers?.[0] ?? null;
  const firstCabinClass =
    firstSegmentPassenger?.cabin_class ??
    firstSegmentPassenger?.cabin?.marketing_name ??
    null;
  const firstBrandLabel =
    offer.slices?.[0]?.fare_brand_name ??
    firstSegmentPassenger?.cabin_class_marketing_name ??
    null;
  const passengerCount = Array.isArray(offer.passengers) && offer.passengers.length > 0
    ? offer.passengers.length
    : 1;
  const totalAmount = Number(offer.total_amount ?? 0);
  const perPersonAmount =
    passengerCount > 0 && totalAmount > 0
      ? (totalAmount / passengerCount).toFixed(2)
      : null;
  const baggage = mapDuffelBaggage(offer);

  return {
    ...offer,
    computed: {
      ...(offer.computed ?? {}),
      airlineNames,
      baggage: {
        ...(offer.computed?.baggage ?? {}),
        ...baggage,
      },
    },
    price: {
      currency: offer.total_currency,
      total: offer.total_amount,
      grandTotal: offer.total_amount,
    },
    validatingAirlineCodes:
      offer.computed?.airlines?.length
        ? offer.computed.airlines
        : offer.owner?.iata_code
          ? [offer.owner.iata_code]
          : [],
    lastTicketingDate:
      offer.payment_requirements?.payment_required_by ?? null,
    travelerPricings: firstPassenger
      ? [
          {
            price: {
              total: perPersonAmount,
            },
            fareDetailsBySegment: [
              {
                cabin: firstCabinClass ?? "economy",
                brandedFareLabel: firstBrandLabel,
              },
            ],
          },
        ]
      : [],
    itineraries,
  };
}
