"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { StripeError } from "@stripe/stripe-js";
import {
  confirmPaymentIntent,
  createPaymentIntent,
  type DuffelPaymentIntent,
} from "@/src/api/routes/orders/payment";
import EmailVerificationModal from "./components/EmailVerificationModal";

const DuffelPayments = dynamic(
  async () => (await import("@duffel/components")).DuffelPayments,
  { ssr: false }
);

type PaymentStepProps = {
  offerId: string;
  amountLabel?: string;
  onPaymentConfirmed?: (paymentIntent: DuffelPaymentIntent) => void | Promise<void>;
  emailVerificationRequired?: boolean;
  emailVerificationCompleted?: boolean;
  onEmailVerificationSuccess?: (email: string) => void;
  initialVerificationEmail?: string;
  onVerificationLoginRequired?: (email: string, message?: string) => void;
};

export default function PaymentStep({
  offerId,
  amountLabel,
  onPaymentConfirmed,
  emailVerificationRequired = true,
  emailVerificationCompleted = false,
  onEmailVerificationSuccess,
  initialVerificationEmail,
  onVerificationLoginRequired,
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
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  const isVerificationDone =
    emailVerificationCompleted || Boolean(verifiedEmail);
  const requiresVerificationNow =
    emailVerificationRequired && !isVerificationDone;

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
      } catch (error: unknown) {
        if (!cancelled) {
          setPaymentIntent(null);
          setPaymentError(getErrorMessage(error, "Failed to initialise payment."));
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
      setPaymentSuccessMessage("Card payment was confirmed.");

      try {
        await onPaymentConfirmed?.(confirmedIntent);
        setPaymentSuccessMessage("Card payment was confirmed and the order was created.");
      } catch (orderError: unknown) {
        setPaymentError(
          getErrorMessage(
            orderError,
            "Payment was confirmed, but order creation failed."
          )
        );
      }
    } catch (error: unknown) {
      setPaymentError(getErrorMessage(error, "Payment confirmation failed."));
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
          {requiresVerificationNow ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">
                Verify email before final booking confirmation
              </div>
              <p className="mt-1 text-sm text-amber-800">
                We&apos;ll send a one-time code to link this booking securely to
                your verified email account.
              </p>
              <button
                type="button"
                onClick={() => setVerificationOpen(true)}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Verify email
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Email verified{verifiedEmail ? `: ${verifiedEmail}` : ""}
            </div>
          )}

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

          {paymentIntent?.client_token && !requiresVerificationNow ? (
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

      <EmailVerificationModal
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        initialEmail={initialVerificationEmail}
        onLoginRequired={(email, message) => {
          setVerificationOpen(false);
          setPaymentError(
            message ||
              "This email is already registered. Please sign in to continue booking."
          );
          onVerificationLoginRequired?.(email, message);
        }}
        onVerified={(email) => {
          setVerifiedEmail(email);
          onEmailVerificationSuccess?.(email);
        }}
      />
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
