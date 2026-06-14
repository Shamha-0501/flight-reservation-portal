import { http } from "../../config/http";
import type { TenantAddonSettings } from "@/src/shared/lib/tenantAddonSettings";

export const getTenantAddonSettings = async (
  tenantKey: string
): Promise<TenantAddonSettings> => {
  try {
    const response = await http.get("/api/extras", {
      params: { tenantKey },
    });

    const settings = response.data?.data ?? response.data;

    if (!settings) {
      throw new Error("Tenant addon settings were not returned.");
    }

    return settings;
  } catch (error: unknown) {
    console.error("Error fetching tenant addon settings:", error);
    throw new Error(
      getApiErrorMessage(error, "Failed to load tenant addon settings.")
    );
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
