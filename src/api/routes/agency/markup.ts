import { csrf, http } from "../../config/http";
import type { AgencyMarkupSettings } from "@/src/shared/lib/agencyMarkup";

type AgencyMarkupResponse = {
  data?: AgencyMarkupSettings;
  message?: string;
};

export async function getAgencyMarkupSettings(
  tenantKey: string,
): Promise<AgencyMarkupSettings | null> {
  try {
    const response = await http.get<AgencyMarkupResponse>("/api/agency/markup", {
      params: { tenantKey },
    });

    const result = response.data?.data ?? response.data ?? null;
    return isAgencyMarkupSettings(result) ? result : null;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load markup settings."),
    );
  }
}

export async function getBookingMarkupSettings(
  tenantKey: string,
): Promise<AgencyMarkupSettings | null> {
  try {
    const response = await http.get<AgencyMarkupResponse>("/api/booking/markup", {
      params: { tenantKey },
    });

    const result = response.data?.data ?? response.data ?? null;
    return isAgencyMarkupSettings(result) ? result : null;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load markup settings."),
    );
  }
}

export async function updateAgencyMarkupSettings(
  payload: AgencyMarkupSettings & { tenantKey?: string },
): Promise<AgencyMarkupSettings> {
  try {
    await csrf();
    const response = await http.put<AgencyMarkupResponse>("/api/agency/markup", payload);
    const result = response.data?.data ?? response.data;
    if (!isAgencyMarkupSettings(result)) {
      throw new Error("Markup settings were not returned.");
    }
    return result;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to save markup settings."),
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

function isAgencyMarkupSettings(value: unknown): value is AgencyMarkupSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<AgencyMarkupSettings>;
  return (
    typeof candidate.is_enabled === "boolean" &&
    typeof candidate.markup_mode === "string" &&
    typeof candidate.markup_value === "number" &&
    typeof candidate.currency === "string"
  );
}
