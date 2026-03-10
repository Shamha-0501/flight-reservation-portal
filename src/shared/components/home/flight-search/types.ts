export type TripType = "oneway" | "roundtrip";

export type FlightDates = {
  departure: Date | null;
  return: Date | null;
};

export type CabinClass =
  | "Economy"
  | "Premium Economy"
  | "Business"
  | "First";

export type Passengers = {
  adults: number;
  children: number;
  infants: number;
};
