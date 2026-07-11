import { http } from "../../config/http";

export type OrderChangeabilityResponse = {
  allowed?: boolean;
  [key: string]: unknown;
};

export type OrderChangeOfferSummary = {
  id?: string | null;
  airline?: {
    name?: string | null;
    iata_code?: string | null;
  } | null;
  departure_at?: string | null;
  arrival_at?: string | null;
  duration?: string | null;
  stops?: number | null;
  cabin_class?: string | null;
  baggage?: unknown;
  fare_difference_amount?: string | number | null;
  additional_payment_amount?: string | number | null;
  refund_amount?: string | number | null;
  currency?: string | null;
  expires_at?: string | null;
  raw?: Record<string, unknown>;
};

export type OrderChangeSummary = {
  fare_difference_amount?: string | number | null;
  change_fee_amount?: string | number | null;
  new_total_amount?: string | number | null;
  additional_payment_amount?: string | number | null;
  refund_amount?: string | number | null;
  currency?: string | null;
  refund_to?: string | null;
  expires_at?: string | null;
};

export type OrderChangeRequestResponse = {
  message?: string;
  order_id?: number | string;
  change_status?: string | null;
  data?: Record<string, unknown>;
  offers?: OrderChangeOfferSummary[];
};

export type OrderChangeOfferResponse = {
  data?: Record<string, unknown>;
  offer?: OrderChangeOfferSummary;
  summary?: OrderChangeSummary;
};

export type OrderChangeResponse = {
  message?: string;
  order_id?: number | string;
  status?: string | null;
  change_status?: string | null;
  data?: Record<string, unknown>;
  summary?: OrderChangeSummary;
};

export type OrderWorkflowActionResponse = {
  message?: string;
  order_id?: number | string;
  status?: string | null;
  change_status?: string | null;
  order?: Record<string, unknown>;
};

export async function getOrderChangeableStatus(orderId: string | number) {
  try {
    const response = await http.get<OrderChangeabilityResponse>(
      `/api/order-changeable-status/${orderId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch changeability status.")
    );
  }
}

export async function createOrderChangeRequest(payload: {
  order_id: string | number;
  slices: {
    remove?: Array<{ slice_id: string }>;
    add?: Array<{
      origin: string;
      destination: string;
      departure_date: string;
      cabin_class?: string;
    }>;
  };
}) {
  try {
    const requestPayload = {
      ...payload,
      order_id: String(payload.order_id),
    };
    const response = await http.post<OrderChangeRequestResponse>(
      "/api/order-change-requests",
      requestPayload
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create order change request.")
    );
  }
}

export async function getOrderChangeRequest(orderChangeRequestId: string) {
  try {
    const response = await http.get<OrderChangeRequestResponse>(
      `/api/order-change-requests/${orderChangeRequestId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch order change request.")
    );
  }
}

export async function getOrderChangeOffer(orderChangeOfferId: string) {
  try {
    const response = await http.get<OrderChangeOfferResponse>(
      `/api/order-change-offers/${orderChangeOfferId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch order change offer.")
    );
  }
}

export async function createOrderChange(payload: {
  order_id: string | number;
  selected_order_change_offer: string;
}) {
  try {
    const requestPayload = {
      ...payload,
      order_id: String(payload.order_id),
    };
    const response = await http.post<OrderChangeResponse>(
      "/api/order-changes",
      requestPayload
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create order change.")
    );
  }
}

export async function getOrderChange(orderChangeId: string) {
  try {
    const response = await http.get<OrderChangeResponse>(
      `/api/order-changes/${orderChangeId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch order change.")
    );
  }
}

export async function confirmOrderChange(params: {
  orderId: string | number;
  orderChangeId: string;
  payment?: Record<string, unknown>;
}) {
  try {
    const requestBody = {
      order_id: String(params.orderId),
      payment: params.payment,
    };
    const response = await http.post<OrderChangeResponse>(
      `/api/order-changes/${params.orderChangeId}/confirm`,
      requestBody
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to confirm order change.")
    );
  }
}

export async function approveOrderChangeWorkflow(params: {
  orderId: string | number;
  tenantKey?: string;
  note?: string;
}) {
  try {
    const response = await http.post<OrderWorkflowActionResponse>(
      `/api/orders/${params.orderId}/change/approve`,
      {
        tenantKey: params.tenantKey,
        note: params.note,
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to approve order change.")
    );
  }
}

export async function rejectOrderChangeWorkflow(params: {
  orderId: string | number;
  tenantKey?: string;
  reason?: string;
}) {
  try {
    const response = await http.post<OrderWorkflowActionResponse>(
      `/api/orders/${params.orderId}/change/reject`,
      {
        tenantKey: params.tenantKey,
        reason: params.reason,
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to reject order change.")
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
