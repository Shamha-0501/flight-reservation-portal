import { http } from "../../config/http";

export type OrderPassengerPayload = {
  id: string;
  type: "adult" | "child" | "infant_without_seat";
  title: string;
  given_name: string;
  family_name: string;
  born_on: string;
  gender: string;
  email?: string;
  phone_number?: string;
  loyalty_programme_accounts?: Array<{
    account_number: string;
    airline_iata_code: string;
  }>;
  infant_passenger_id?: string;
};

export type OrderAddonPayload = {
  duffel_baggage_enabled?: boolean;
  duffel_baggage_count?: number;
  duffel_baggage_amount?: number;
  duffel_baggage_currency?: string;

  duffel_seat_enabled?: boolean;
  duffel_seat_count?: number;
  duffel_seat_amount?: number;
  duffel_seat_currency?: string;

  cancellation_guarantee_enabled?: boolean;
  cancellation_guarantee_type?: string | null;

  flexible_date_change_enabled?: boolean;
  flexible_date_change_type?: string | null;

  rebooking_assistance_enabled?: boolean;
  name_correction_support_enabled?: boolean;
  schedule_change_support_enabled?: boolean;

  travel_insurance_enabled?: boolean;
  travel_insurance_plan?: string | null;

  notification_alerts_enabled?: boolean;
  sms_alerts_enabled?: boolean;
  whatsapp_alerts_enabled?: boolean;

  priority_support_enabled?: boolean;
  priority_support_type?: string | null;

  disruption_compensation_support_enabled?: boolean;
  baggage_protection_enabled?: boolean;
  airport_assistance_enabled?: boolean;
  checkin_assistance_enabled?: boolean;

  travel_connectivity_enabled?: boolean;
  travel_connectivity_type?: string | null;

  premium_airport_services_enabled?: boolean;
  premium_airport_service_type?: string | null;

  agency_addons_amount?: number;
  duffel_addons_amount?: number;
  total_addons_amount?: number;
  currency?: string;
};

export type OrderAgencyMarkupPayload = {
  enabled: boolean;
  mode: "percentage" | "fixed";
  value: number;
  amount: number;
  currency: string;
  label?: string | null;
};

export type BookingAddonSnapshot = {
  addon_id: number;
  addon_code: string;
  addon_name: string;
  price: number;
  currency: string;
  meta?: Record<string, unknown> | null;
};

export type CreateOrderRequestBody = {
  tenantKey: string;
  offer_id: string;
  passengers: OrderPassengerPayload[];
  addons?: OrderAddonPayload;
  booking_addons?: BookingAddonSnapshot[];
  agency_markup?: OrderAgencyMarkupPayload | null;
  contact_email?: string;
};

export type CreateOrderResponse = {
  message?: string;
  order?: {
    booking_reference?: string | null;
    [key: string]: unknown;
  };
  duffel_order?: Record<string, unknown>;
};

export function buildCreateOrderRequestBody(
  tenantKey: string,
  offerId: string,
  passengers: OrderPassengerPayload[],
  addons?: OrderAddonPayload,
  bookingAddons?: BookingAddonSnapshot[],
  agencyMarkup?: OrderAgencyMarkupPayload | null,
  contactEmail?: string
): CreateOrderRequestBody {
  return {
    tenantKey,
    offer_id: offerId,
    passengers,
    ...(addons ? { addons } : {}),
    ...(bookingAddons?.length ? { booking_addons: bookingAddons } : {}),
    ...(agencyMarkup ? { agency_markup: agencyMarkup } : {}),
    ...(contactEmail ? { contact_email: contactEmail } : {}),
  };
}

export const createOrder = async (
  payload: CreateOrderRequestBody
): Promise<CreateOrderResponse> => {
  try {
    const response = await http.post("/api/orders", payload);
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create order."));
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
