import { http } from "../../config/http";
import { FlightSearchParams } from "../../types";

export const searchFlights = async (searchParams: FlightSearchParams) => {
  try {
    const response = await http.get("/api/flightSearch", {
      params: {
        originLocationCode: searchParams.origin,
        destinationLocationCode: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate || "",
        adults: searchParams.adults,
        children: searchParams.children || 0,
        infants: searchParams.infants || 0,
        travelClass: searchParams.travelClass || "ECONOMY",
      },
    });

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