"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { StripeError } from "@stripe/stripe-js";
import {
  confirmPaymentIntent,
  createPaymentIntent,
  type DuffelPaymentIntent,
} from "@/src/api/routes/orders/payment";

const DuffelPayments = dynamic(
  async () => (await import("@duffel/components")).DuffelPayments,
  { ssr: false }
);

type PaymentStepProps = {
  offerId: string;
  amountLabel?: string;
  onPaymentConfirmed?: (paymentIntent: DuffelPaymentIntent) => void;
};

export default function PaymentStep({
  offerId,
  amountLabel,
  onPaymentConfirmed,
}: PaymentStepProps) {
  const [paymentIntent, setPaymentIntent] = useState<DuffelPaymentIntent | null>(
    null
  );
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [confirmingIntent, setConfirmingIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!offerId) {
      setPaymentIntent(null);
      setPaymentError("Selected offer is missing for payment.");
      return;
    }

    let cancelled = false;

    async function run() {
      setLoadingIntent(true);
      setPaymentError(null);
      setPaymentSuccessMessage(null);

      try {
        const createdIntent = await createPaymentIntent(offerId);

        if (!cancelled) {
          setPaymentIntent(createdIntent);
        }
      } catch (error: any) {
        if (!cancelled) {
          setPaymentIntent(null);
          setPaymentError(error?.message || "Failed to initialise payment.");
        }
      } finally {
        if (!cancelled) {
          setLoadingIntent(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [offerId]);

  const handlePaymentFailure = (error: StripeError) => {
    setPaymentSuccessMessage(null);
    setPaymentError(error.message || "Card payment failed.");
  };

  const handlePaymentSuccess = async () => {
    if (!paymentIntent?.id) {
      setPaymentError("Payment intent was not ready for confirmation.");
      return;
    }

    setConfirmingIntent(true);
    setPaymentError(null);

    try {
      const confirmedIntent = await confirmPaymentIntent(paymentIntent.id);
      setPaymentIntent(confirmedIntent);
      setPaymentSuccessMessage(
        "Card payment was collected successfully and the payment intent is confirmed."
      );
      onPaymentConfirmed?.(confirmedIntent);
    } catch (error: any) {
      setPaymentError(error?.message || "Payment confirmation failed.");
    } finally {
      setConfirmingIntent(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
        <div className="p-5 sm:p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Payment
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
            Pay with card
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Card details are collected securely by Duffel. After a successful
            card payment, we will confirm the payment intent before creating the
            booking.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Payment details
          </div>
          <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
            Duffel payment form
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {amountLabel
              ? `Your customer will be charged ${amountLabel}.`
              : "Your customer will be charged the booking total shown in the summary."}
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {loadingIntent ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Preparing secure payment form...
            </div>
          ) : null}

          {paymentError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {paymentError}
            </div>
          ) : null}

          {paymentSuccessMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {paymentSuccessMessage}
            </div>
          ) : null}

          {confirmingIntent ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Confirming the payment intent with Duffel...
            </div>
          ) : null}

          {paymentIntent?.client_token ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <DuffelPayments
                paymentIntentClientToken={paymentIntent.client_token}
                onSuccessfulPayment={handlePaymentSuccess}
                onFailedPayment={handlePaymentFailure}
              />
            </div>
          ) : null}

          {paymentIntent?.status === "succeeded" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                Confirmed payment intent
              </div>
              <div className="mt-2">
                Intent ID: <span className="font-mono">{paymentIntent.id}</span>
              </div>
              {paymentIntent.card_network || paymentIntent.card_last_four_digits ? (
                <div className="mt-1">
                  Card:{" "}
                  {[paymentIntent.card_network, paymentIntent.card_last_four_digits]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
