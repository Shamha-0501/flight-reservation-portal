import { http } from "../../config/http";

export type TenantAgency = {
  id: number;
  key: string;
  name: string;
  status?: string;
  timezone?: string | null;
  locale?: string | null;
  meta?: {
    contact_email?: string;
    contact_phone?: string;
    country?: string;
    industry?: string;
    [key: string]: unknown;
  } | null;
  markup?: {
    type?: "fixed" | "percentage";
    value?: number;
    currency?: string;
  } | null;
  trial_ends_at?: string | null;
  suspended_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const getActiveAgencies = async (): Promise<TenantAgency[]> => {
  try {
    const response = await http.get("/api/tenants/active");
    const agencies = response.data?.data ?? response.data;

    if (!Array.isArray(agencies)) {
      throw new Error("Active agencies were not returned by the backend.");
    }

    return agencies;
  } catch (error: unknown) {
    console.error("Error fetching active agencies:", error);
    throw new Error(getApiErrorMessage(error, "Failed to load agencies."));
  }
};

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
