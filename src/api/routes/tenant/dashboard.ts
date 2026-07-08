import { http } from "../../config/http";
import type { BookingListItem } from "../orders/bookings";

export type TenantDashboardStats = {
  total_bookings: number;
  active_bookings: number;
  cancellation_requests: number;
  refund_pendings: number;
  reschedule_requests: number;
  customers: number;
  revenue: {
    amount: string;
    currency: string;
  };
};

export type TenantActivityLog = {
  id: number;
  tenant_id?: number | null;
  user_id?: number | null;
  action: string;
  category?: string | null;
  title: string;
  description?: string | null;
  subject_type?: string | null;
  subject_id?: number | null;
  properties?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  actor?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
  };
  tenant?: {
    id?: number | null;
    key?: string | null;
    name?: string | null;
    status?: string | null;
  };
  created_at?: string | null;
  updated_at?: string | null;
};

export type TenantDashboardPayload = {
  tenant: {
    id: number;
    key: string;
    name: string;
  };
  stats: TenantDashboardStats;
  recent_bookings: BookingListItem[];
  recent_bookings_window: {
    from: string;
    to: string;
    limit: number;
  };
  trend: {
    from: string;
    to: string;
    points: Array<{
      date: string;
      label: string;
      bookings: number;
      cancellations: number;
      revenue: string;
    }>;
  };
};

type TenantDashboardResponse = {
  ok?: boolean;
  data?: TenantDashboardPayload;
};

type TenantActivityResponse = {
  data: TenantActivityLog[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function getTenantDashboard(
  tenantKey: string,
): Promise<TenantDashboardPayload> {
  try {
    const response = await http.get<TenantDashboardResponse>("/api/tenants/dashboard", {
      params: { tenantKey },
    });

    const payload = response.data?.data;

    if (!payload) {
      throw new Error("Tenant dashboard payload was not returned.");
    }

    return payload;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load tenant dashboard."));
  }
}

export async function getTenantActivities(params: {
  tenantKey: string;
  page?: number;
  per_page?: number;
}): Promise<TenantActivityResponse> {
  try {
    const response = await http.get<TenantActivityResponse>("/api/tenants/activities", {
      params,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load tenant activities."));
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
