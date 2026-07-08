import { http } from "../../config/http";

export type TenantCustomer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  total_bookings: number;
  active_bookings: number;
  cancelled_bookings: number;
  refund_pending_bookings: number;
  status: string;
  last_booking_at?: string | null;
};

type TenantCustomersResponse = {
  data: TenantCustomer[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function getTenantCustomers(params: {
  tenantKey: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<TenantCustomersResponse> {
  try {
    const response = await http.get<TenantCustomersResponse>("/api/tenants/customers", {
      params,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load tenant customers."));
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
