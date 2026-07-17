import { http } from "../../config/http";

export type AdminReportGroupBy = "week" | "month" | "year";
export type AdminReportFormat = "csv" | "pdf";
export type AdminReportScope = "platform" | "tenant";

export type AdminReportSummary = {
  revenue: {
    amount: string;
    currency: string;
  };
  booking_volume: number;
  cancellation_rate: number;
  refund_totals: {
    amount: string;
    currency: string;
  };
  customer_counts: number;
  top_agencies: Array<{
    id: number;
    key: string;
    name: string;
    bookings: number;
    revenue: {
      amount: string;
      currency: string;
    };
  }>;
};

export type AdminReportSeriesPoint = {
  label: string;
  bookings: number;
  cancellations: number;
  revenue: {
    amount: string;
    currency: string;
  };
};

export type AdminReportsPayload = {
  range: {
    from: string;
    to: string;
    group_by: AdminReportGroupBy;
  };
  scope: {
    kind: "platform" | "tenant";
    name: string;
  };
  summary: AdminReportSummary;
  series: AdminReportSeriesPoint[];
  airlines_and_routes: {
    top_airlines: AdminReportDimension[];
    top_routes: AdminReportDimension[];
  };
  system_activity: AdminReportSystemActivity | null;
  operations: {
    pending_cancellations: number;
    pending_refunds: number;
    rescheduled_orders: number;
    refunded_orders: number;
  };
  customers: {
    top_customers: Array<{
      id: number;
      name: string | null;
      email: string | null;
      bookings: number;
      booking_value: { amount: string; currency: string };
    }>;
  };
  addon_usage: {
    total_usage: number;
    items: Array<{
      code: string;
      name: string;
      usage: number;
      value: { amount: string; currency: string };
    }>;
  };
  comparison: {
    previous_range: AdminReportSummary;
    growth: {
      booking_volume: number | null;
      revenue: number | null;
      customer_counts: number | null;
      refund_totals: number | null;
    };
  };
  filters: AdminReportFilters;
  filter_options: {
    booking_statuses: string[];
    cancellation_statuses: string[];
    refund_statuses: string[];
    airlines: string[];
    routes: string[];
    tenants: Array<{ id: number; name: string }>;
  };
};

export type AdminReportFilters = {
  tenant_id?: number;
  booking_status?: string;
  cancellation_status?: string;
  refund_status?: string;
  airline?: string;
  route?: string;
};

export type AdminReportDimension = {
  key: string;
  name: string;
  bookings: number;
  revenue: {
    amount: string;
    currency: string;
  };
};

export type AdminReportSystemActivity = {
  total_events: number;
  top_actions: Array<{ action: string; count: number }>;
  recent_events: Array<{
    id: number;
    action: string;
    category: string | null;
    title: string;
    actor_name: string | null;
    tenant_name: string | null;
    created_at: string | null;
  }>;
};

type AdminReportsResponse = {
  ok?: boolean;
  data?: AdminReportsPayload;
};

export async function getAdminReports(params: {
  from: string;
  to: string;
  group_by?: AdminReportGroupBy;
  scope: AdminReportScope;
} & AdminReportFilters): Promise<AdminReportsPayload> {
  try {
    const { scope, ...query } = params;
    const endpoint = scope === "platform" ? "/api/admin/reports/platform" : "/api/tenants/reports";
    const response = await http.get<AdminReportsResponse>(endpoint, {
      params: query,
    });
    const payload = response.data?.data;

    if (!payload) {
      throw new Error("Admin reports payload was not returned.");
    }

    return payload;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load admin reports."));
  }
}

export async function exportAdminReports(params: {
  from: string;
  to: string;
  group_by?: AdminReportGroupBy;
  format: AdminReportFormat;
  scope: AdminReportScope;
} & AdminReportFilters) {
  try {
    const { scope, ...query } = params;
    const endpoint = scope === "platform" ? "/api/admin/reports/platform/export" : "/api/tenants/reports/export";
    const response = await http.get(endpoint, {
      params: query,
      responseType: "blob",
    });

    return response.data as Blob;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to export admin reports."));
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
