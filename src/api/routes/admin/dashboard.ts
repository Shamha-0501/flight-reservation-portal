import { http } from "../../config/http";
import type { BookingListItem } from "../orders/bookings";

export type AdminDashboardStats = {
  total_bookings: number;
  active_bookings: number;
  cancellation_requests: number;
  refund_pendings: number;
  reschedule_requests: number;
  customers: number;
  agencies: number;
  revenue: {
    amount: string;
    currency: string;
  };
};

export type AdminActivityLog = {
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

export type AdminDashboardPayload = {
  stats: AdminDashboardStats;
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

type AdminDashboardResponse = {
  ok?: boolean;
  data?: AdminDashboardPayload;
};

type AdminActivityResponse = {
  data: AdminActivityLog[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function getAdminDashboard(params?: {
  tenant_id?: number | string;
  from?: string;
  to?: string;
  group_by?: "day" | "week" | "month";
}): Promise<AdminDashboardPayload> {
  try {
    const response = await http.get<AdminDashboardResponse>("/api/admin/dashboard", {
      params,
    });
    const payload = response.data?.data;

    if (!payload) {
      throw new Error("Admin dashboard payload was not returned.");
    }

    return payload;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load admin dashboard."));
  }
}

export async function getAdminActivities(params?: {
  tenant_id?: number | string;
  per_page?: number;
}): Promise<AdminActivityResponse> {
  try {
    const response = await http.get<AdminActivityResponse>("/api/admin/activities", {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load admin activities."));
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
