import { http } from "../../config/http";

export type DuffelPaymentIntent = {
  id: string;
  client_token: string;
  status: string;
  amount: string;
  currency: string;
  confirmed_at?: string | null;
  card_last_four_digits?: string | null;
  card_network?: string | null;
  card_country_code?: string | null;
};

export const createPaymentIntent = async (
  offerId: string
): Promise<DuffelPaymentIntent> => {
  try {
    const response = await http.post("/api/payment-intents", {
      offer_id: offerId,
    });

    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to start card payment."
    );
  }
};

export const confirmPaymentIntent = async (
  paymentIntentId: string
): Promise<DuffelPaymentIntent> => {
  try {
    const response = await http.post(
      `/api/payment-intents/${paymentIntentId}/confirm`
    );

    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error("Error confirming payment intent:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to confirm card payment."
    );
  }
};
