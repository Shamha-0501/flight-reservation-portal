import { http } from "../../config/http";

export type BookingListItem = {
  id: number;
  tenant_id: number;
  duffel_order_id?: string | null;
  booking_reference?: string | null;
  status?: string | null;
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
  tenantKey: string;
  email?: string;
  status?: string;
  page?: number;
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

