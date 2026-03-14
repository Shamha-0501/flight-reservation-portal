import { http } from "../../config/http";
import type {
  FlightSearchRequest,
  FlightSearchResponse,
} from "../../types";

export const searchFlights = async (
  request: FlightSearchRequest
): Promise<FlightSearchResponse> => {
  try {
    // Split request into required search params and optional filters
    const { params, filters } = request;
    // Map frontend fields to backend query parameter names
    const query: Record<string, any> = {
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate || "",
      adults: params.adults,
      children: params.children || 0,
      infants: params.infants || 0,
      travelClass: params.travelClass || "ECONOMY",
    };

    if (filters) {
      // Only add filters when provided to keep requests clean
      if (filters.minPrice != null) query.minPrice = filters.minPrice;
      if (filters.maxPrice != null) query.maxPrice = filters.maxPrice;
      if (filters.stops?.length) query.stops = filters.stops;
      if (filters.baggage?.length) query.baggage = filters.baggage;
      if (filters.includeAirlines?.length)
        query.includeAirlines = filters.includeAirlines;
      if (filters.excludeAirlines?.length)
        query.excludeAirlines = filters.excludeAirlines;
      if (filters.outDepartMin != null) query.outDepartMin = filters.outDepartMin;
      if (filters.outDepartMax != null) query.outDepartMax = filters.outDepartMax;
      if (filters.inDepartMin != null) query.inDepartMin = filters.inDepartMin;
      if (filters.inDepartMax != null) query.inDepartMax = filters.inDepartMax;
      if (filters.minDurationMinutes != null)
        query.minDurationMinutes = filters.minDurationMinutes;
      if (filters.maxDurationMinutes != null)
        query.maxDurationMinutes = filters.maxDurationMinutes;
      if (filters.avoidLayovers?.length)
        query.avoidLayovers = filters.avoidLayovers;
      if (filters.onlyLayovers?.length)
        query.onlyLayovers = filters.onlyLayovers;
      if (filters.refundable != null) query.refundable = filters.refundable;
      if (filters.changeable != null) query.changeable = filters.changeable;
      if (filters.minCheckedBags != null)
        query.minCheckedBags = filters.minCheckedBags;
      if (filters.sortBy) query.sortBy = filters.sortBy;
      if (filters.sortDir) query.sortDir = filters.sortDir;
    }

    // Call backend API with query params
    const response = await http.get("/api/flightSearch", {
      params: query,
    });

    // Return raw API payload (data + meta + dictionaries)
    return response.data;
  } catch (error: any) {
    console.error("Error searching flights:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to search flights."
    );
  } finally {
    console.log("Search flights API call completed.");
  }
};
