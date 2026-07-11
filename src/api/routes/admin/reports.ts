import { http } from "../../config/http";

export type AdminReportGroupBy = "day" | "week" | "month";
export type AdminReportFormat = "csv" | "pdf";

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
  summary: AdminReportSummary;
  series: AdminReportSeriesPoint[];
};

type AdminReportsResponse = {
  ok?: boolean;
  data?: AdminReportsPayload;
};

export async function getAdminReports(params: {
  from: string;
  to: string;
  group_by?: AdminReportGroupBy;
  tenant_id?: number | string;
}): Promise<AdminReportsPayload> {
  try {
    const response = await http.get<AdminReportsResponse>("/api/admin/reports", {
      params,
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
  tenant_id?: number | string;
}) {
  try {
    const response = await http.get("/api/admin/reports/export", {
      params,
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
