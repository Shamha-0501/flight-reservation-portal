import { http } from "../config/http";
import type { DuffelSeatMapResponse } from "@/src/shared/lib/seatMaps";

export async function fetchSeatMaps(offerId: string): Promise<DuffelSeatMapResponse> {
  try {
    const response = await http.get("/api/seat-maps", {
      params: { offer_id: offerId },
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch seat maps."));
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseError = error as {
    response?: { data?: { message?: string; error?: string } };
  };

  return (
    responseError.response?.data?.message ||
    responseError.response?.data?.error ||
    (error instanceof Error ? error.message : fallback)
  );
}
