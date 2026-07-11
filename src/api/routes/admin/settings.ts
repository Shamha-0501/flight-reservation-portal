import { csrf, http } from "../../config/http";

export type AdminNotificationPreferences = {
  refund_status_updates: boolean;
  reschedule_approvals: boolean;
  daily_booking_digest: boolean;
  agency_onboarding_alerts: boolean;
  security_alerts: boolean;
  operational_alerts: boolean;
};

export type AdminSettingsPayload = {
  scope: "platform" | "tenant";
  workspace_name: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  currency: string;
  theme: string;
  notifications: AdminNotificationPreferences;
};

type AdminSettingsResponse = {
  ok?: boolean;
  data?: AdminSettingsPayload;
};

export async function getAdminSettings(params: {
  scope: "platform" | "tenant";
  tenantKey?: string;
}): Promise<AdminSettingsPayload> {
  try {
    const endpoint =
      params.scope === "platform" ? "/api/admin/settings" : "/api/tenants/settings";

    const response = await http.get<AdminSettingsResponse>(endpoint, {
      params: params.tenantKey ? { tenantKey: params.tenantKey } : undefined,
    });

    const payload = response.data?.data;

    if (!payload) {
      throw new Error("Admin settings payload was not returned.");
    }

    return payload;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load settings."));
  }
}

export async function updateAdminSettings(
  payload: AdminSettingsPayload & { tenantKey?: string },
) {
  try {
    await csrf();

    const endpoint =
      payload.scope === "platform" ? "/api/admin/settings" : "/api/tenants/settings";
    const response = await http.patch(endpoint, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to save settings."));
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
