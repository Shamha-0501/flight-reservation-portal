import { http } from "../../config/http";

export type OrderRefundableStatusResponse = {
  refund_before_departure?: {
    allowed?: boolean;
    penalty_amount?: string | number | null;
    penalty_currency?: string | null;
  };
  [key: string]: unknown;
};

export type OrderCancellationResponse = {
  message?: string;
  order_id?: number | string;
  status?: string;
  cancellation_status?: string | null;
  refund_status?: string | null;
  data?: {
    id?: string;
    status?: string;
    [key: string]: unknown;
  };
  quote?: {
    cancellation_id?: string | null;
    refund_amount?: string | number | null;
    refund_currency?: string | null;
    cancellation_fee?: string | number | null;
    cancellation_fee_currency?: string | null;
    expires_at?: string | null;
    confirmed_at?: string | null;
    warnings?: string[] | null;
  };
  [key: string]: unknown;
};

export async function getOrderRefundableStatus(orderId: string | number) {
  try {
    const response = await http.get<OrderRefundableStatusResponse>(
      `/api/order-refundable-status/${orderId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch refundable status.")
    );
  }
}

export async function createOrderCancellation(orderId: string | number) {
  try {
    const response = await http.post<OrderCancellationResponse>(
      "/api/order-cancellations",
      { order_id: orderId }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create cancellation quote.")
    );
  }
}

export async function getOrderCancellation(cancellationId: string) {
  try {
    const response = await http.get<OrderCancellationResponse>(
      `/api/order-cancellations/${cancellationId}`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch cancellation details.")
    );
  }
}

export async function confirmOrderCancellation(params: {
  cancellationId: string;
  orderId: string | number;
}) {
  try {
    const response = await http.post<OrderCancellationResponse>(
      `/api/order-cancellations/${params.cancellationId}/confirm/${params.orderId}`,
      { order_id: params.orderId, cancellation_id: params.cancellationId }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to confirm cancellation.")
    );
  }
}

export async function confirmOrderRefund(params: {
  orderId: string | number;
  reference?: string;
  notes?: string;
}) {
  try {
    const response = await http.post<OrderCancellationResponse>(
      `/api/orders/${params.orderId}/refunds/confirm`,
      {
        reference: params.reference,
        notes: params.notes,
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to confirm refund.")
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
