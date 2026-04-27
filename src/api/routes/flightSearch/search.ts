import { http } from "../../config/http";
import type {
  FlightSearchFilters,
  FlightSearchParams,
  FlightSearchRequest,
  FlightSearchResponse,
} from "../../types";

function mapStopsForOfferRequest(stops?: FlightSearchFilters["stops"]) {
  if (!stops?.length) return undefined;

  return Array.from(
    new Set(
      stops.map((stop) => (stop === "2plus" ? "2" : stop))
    )
  ) as Array<"0" | "1" | "2">;
}

function buildSearchPayload(
  params: FlightSearchParams,
  filters?: FlightSearchFilters
) {
  const searchPayload: Record<string, any> = {
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate || undefined,
    trip: params.trip || "roundtrip",
    adults: params.adults,
    children: params.children || 0,
    infants: params.infants || 0,
    travelClass: params.travelClass || "ECONOMY",
  };

  if (filters) {
    if (filters.outDepartMin != null) searchPayload.outDepartMin = filters.outDepartMin;
    if (filters.outDepartMax != null) searchPayload.outDepartMax = filters.outDepartMax;
    if (filters.inDepartMin != null) searchPayload.inDepartMin = filters.inDepartMin;
    if (filters.inDepartMax != null) searchPayload.inDepartMax = filters.inDepartMax;

    const requestStops = mapStopsForOfferRequest(filters.stops);
    if (requestStops?.length) searchPayload.stops = requestStops;
  }

  return searchPayload;
}

function buildOffersQuery(
  offerRequestId: string,
  filters?: FlightSearchFilters
) {
  const offersQuery: Record<string, any> = {
    offer_request_id: offerRequestId,
  };

  if (filters) {
    if (filters.minPrice != null) offersQuery.minPrice = filters.minPrice;
    if (filters.maxPrice != null) offersQuery.maxPrice = filters.maxPrice;
    if (filters.stops?.length) offersQuery.stops = filters.stops;
    if (filters.baggage?.length) offersQuery.baggage = filters.baggage;
    if (filters.includeAirlines?.length)
      offersQuery.includeAirlines = filters.includeAirlines;
    if (filters.excludeAirlines?.length)
      offersQuery.excludeAirlines = filters.excludeAirlines;
    if (filters.outDepartMin != null) offersQuery.outDepartMin = filters.outDepartMin;
    if (filters.outDepartMax != null) offersQuery.outDepartMax = filters.outDepartMax;
    if (filters.inDepartMin != null) offersQuery.inDepartMin = filters.inDepartMin;
    if (filters.inDepartMax != null) offersQuery.inDepartMax = filters.inDepartMax;
    if (filters.minDurationMinutes != null)
      offersQuery.minDurationMinutes = filters.minDurationMinutes;
    if (filters.maxDurationMinutes != null)
      offersQuery.maxDurationMinutes = filters.maxDurationMinutes;
    if (filters.avoidLayovers?.length)
      offersQuery.avoidLayovers = filters.avoidLayovers;
    if (filters.onlyLayovers?.length)
      offersQuery.onlyLayovers = filters.onlyLayovers;
    if (filters.refundable != null) offersQuery.refundable = filters.refundable;
    if (filters.changeable != null) offersQuery.changeable = filters.changeable;
    if (filters.minCheckedBags != null)
      offersQuery.minCheckedBags = filters.minCheckedBags;
    if (filters.sortBy) offersQuery.sortBy = filters.sortBy;
    if (filters.sortDir) offersQuery.sortDir = filters.sortDir;
  }

  return offersQuery;
}

export const createFlightOfferRequest = async (
  params: FlightSearchParams,
  filters?: FlightSearchFilters
): Promise<string> => {
  try {
    const searchPayload = buildSearchPayload(params, filters);
    const offerRequestResponse = await http.post("/api/flights/search", searchPayload);
    const offerRequestId = offerRequestResponse.data?.offer_request_id;

    if (!offerRequestId) {
      throw new Error("Offer request ID was not returned by the backend.");
    }

    return offerRequestId;
  } catch (error: any) {
    console.error("Error creating flight offer request:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to start flight search."
    );
  }
};

export const fetchFlightOffers = async (
  offerRequestId: string,
  filters?: FlightSearchFilters
): Promise<FlightSearchResponse> => {
  try {
    const offersQuery = buildOffersQuery(offerRequestId, filters);
    const response = await http.get("/api/offers", {
      params: offersQuery,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching flight offers:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to fetch flight offers."
    );
  }
};

export const searchFlights = async (
  request: FlightSearchRequest
): Promise<FlightSearchResponse> => {
  const { params, filters } = request;
  const offerRequestId = await createFlightOfferRequest(params, filters);
  return fetchFlightOffers(offerRequestId, filters);
};
