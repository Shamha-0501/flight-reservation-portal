import { http } from "../../config/http";

export type BookingListItem = {
  id: number;
  tenant_id: number;
  tenant_key?: string | null;
  tenant_name?: string | null;
  tenant?: {
    id?: number | null;
    key?: string | null;
    name?: string | null;
  } | null;
  duffel_order_id?: string | null;
  booking_reference?: string | null;
  status?: string | null;
  cancellation_status?: string | null;
  refund_status?: string | null;
  void_window_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  amounts?: {
    total?: {
      amount?: string | number | null;
      currency?: string | null;
    };
  };
  user?: {
    email?: string | null;
    name?: string | null;
  };
  passengers?: Array<{
    id: number;
    type?: string | null;
    title?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    dob?: string | null;
    gender?: string | null;
    email?: string | null;
    phone_number?: string | null;
  }>;
  addons?: Record<string, unknown> | null;
  meta?: {
    offer?: Record<string, unknown> | null;
    duffel_order?: Record<string, unknown> | null;
    change?: {
      status?: string | null;
      request_id?: string | null;
      order_change_id?: string | null;
      selected_order_change_offer?: string | null;
      requested_at?: string | null;
      change_created_at?: string | null;
      approved_at?: string | null;
      approved_by?: string | number | null;
      approval_note?: string | null;
      rejected_at?: string | null;
      rejected_by?: string | number | null;
      rejection_reason?: string | null;
      confirmed_at?: string | null;
      request_payload?: Record<string, unknown> | null;
      request_response?: Record<string, unknown> | null;
      change_response?: Record<string, unknown> | null;
      confirm_response?: Record<string, unknown> | null;
      previous_order_snapshot?: Record<string, unknown> | null;
      latest_order_snapshot?: Record<string, unknown> | null;
      payment_difference?: string | number | null;
      refund_amount?: string | number | null;
      additional_payment_amount?: string | number | null;
    } | null;
    cancellation?: {
      status?: string | null;
      cancellation_id?: string | null;
      requested_at?: string | null;
      refund_amount?: string | number | null;
      refund_currency?: string | null;
      cancellation_fee?: string | number | null;
      cancellation_fee_currency?: string | null;
      expires_at?: string | null;
      approved_at?: string | null;
      approved_by?: string | number | null;
      approval_note?: string | null;
      rejected_at?: string | null;
      rejected_by?: string | number | null;
      rejection_reason?: string | null;
      confirmed_at?: string | null;
      refund_confirmed_at?: string | null;
      warnings?: string[] | null;
      refund_confirmation?: {
        reference?: string | null;
        notes?: string | null;
      } | null;
      cancellation_response?: Record<string, unknown> | null;
    } | null;
  };
};

type BookingListResponse = {
  data: BookingListItem[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function fetchBookings(params: {
  tenantKey?: string;
  email?: string;
  search?: string;
  status?: string;
  cancellation_status?: string;
  refund_status?: string;
  cancellation_scope?: "all";
  page?: number;
  per_page?: number;
}): Promise<BookingListResponse> {
  try {
    const response = await http.get("/api/bookings", { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch bookings."));
  }
}

type BookingDetailsResponse = {
  ok?: boolean;
  order?: BookingListItem;
};

export async function fetchBookingDetails(params: {
  id: string;
  tenantKey: string;
}): Promise<BookingListItem> {
  try {
    const response = await http.get<BookingDetailsResponse>(
      `/api/bookings/${params.id}`,
      {
        params: { tenantKey: params.tenantKey },
      }
    );

    const order = response.data?.order;
    if (!order) {
      throw new Error("Booking details were not returned.");
    }

    return order;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch booking details.")
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

