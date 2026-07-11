import { csrf, http } from "../../config/http";
import type {
  AgencyAddonRecord,
  AgencyAddonUpdatePayload,
} from "@/src/shared/lib/agencyAddons";

type AgencyAddonsResponse = {
  data?: AgencyAddonRecord[] | AgencyAddonRecord;
  message?: string;
};

export async function getAgencyAddons(): Promise<AgencyAddonRecord[]> {
  try {
    const response = await http.get<AgencyAddonsResponse>("/api/agency/addons");
    const payload = response.data?.data ?? response.data;
    return Array.isArray(payload) ? payload : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load agency add-ons.")
    );
  }
}

export async function updateAgencyAddon(
  addonId: number | string,
  payload: AgencyAddonUpdatePayload
): Promise<AgencyAddonRecord> {
  try {
    await csrf();
    const response = await http.put<AgencyAddonsResponse>(
      `/api/agency/addons/${addonId}`,
      payload
    );
    const result = response.data?.data ?? response.data;
    if (Array.isArray(result) || !result) {
      throw new Error("The add-on update response was invalid.");
    }
    return result;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to save add-on settings.")
    );
  }
}

export async function resetAgencyAddon(
  addonId: number | string
): Promise<AgencyAddonRecord> {
  try {
    await csrf();
    const response = await http.post<AgencyAddonsResponse>(
      `/api/agency/addons/${addonId}/reset`
    );
    const result = response.data?.data ?? response.data;
    if (Array.isArray(result) || !result) {
      throw new Error("The add-on reset response was invalid.");
    }
    return result;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to reset add-on settings.")
    );
  }
}

export async function getBookingAvailableAddons(
  tenantKey?: string
): Promise<AgencyAddonRecord[]> {
  try {
    const response = await http.get<AgencyAddonsResponse>(
      "/api/booking/available-addons",
      tenantKey ? { params: { tenantKey } } : undefined
    );
    const payload = response.data?.data ?? response.data;
    return Array.isArray(payload) ? payload : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load booking add-ons.")
    );
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
