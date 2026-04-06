export type FlightSearchParams = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  trip?: "oneway" | "roundtrip";
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
};

export type FlightSearchFilters = {
  minPrice?: number;
  maxPrice?: number;
  stops?: Array<"0" | "1" | "2plus">;
  baggage?: Array<"carryOn" | "checked">;
  includeAirlines?: string[];
  excludeAirlines?: string[];
  outDepartMin?: number;
  outDepartMax?: number;
  inDepartMin?: number;
  inDepartMax?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  avoidLayovers?: string[];
  onlyLayovers?: string[];
  refundable?: boolean;
  changeable?: boolean;
  minCheckedBags?: number;
  sortBy?: "best" | "price" | "duration";
  sortDir?: "asc" | "desc";
};

export type FlightSearchRequest = {
  params: FlightSearchParams;
  filters?: FlightSearchFilters;
};

export type FlightSearchMeta = {
  count?: number;
  currency?: string | null;
  appliedFilters?: FlightSearchAppliedFilters;
  ranges?: Record<string, any>;
  facets?: Record<string, any>;
  summary?: Record<string, any>;
  sort?: {
    current?: { sortBy?: string; sortDir?: string };
    options?: Array<{ sortBy: string; label: string }>;
  };
};

export type FlightSearchAppliedFilters = {
  price?: { min?: number; max?: number };
  stops?: Array<"0" | "1" | "2plus">;
  baggage?: Array<"carryOn" | "checked">;
  airlines?: { include: string[]; exclude: string[] };
  departureTime?: {
    outbound?: { min?: number; max?: number };
    inbound?: { min?: number; max?: number };
  };

  totalDuration?: {
    min?: number;
    max?: number;
  };

  layoverDuration?: {
    min?: number;
    max?: number;
  };

  layoverAirports?: string[];

  refundable?: boolean;
  changeable?: boolean;
};

export type FlightSearchResponse = {
  data: any[];
  meta?: FlightSearchMeta;
  dictionaries?: Record<string, any>;
};
