"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type MockCardPaymentReceipt = {
  amount: number;
  currency: string;
  cardBrand: string;
  cardLast4: string;
  paidAt: string;
};

type MockCardPaymentGateProps = {
  title: string;
  description: string;
  amountDue: number | null;
  currency?: string | null;
  errorMessage?: string | null;
  actionLabel?: string;
  onPaid?: (receipt: MockCardPaymentReceipt) => void | Promise<void>;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
  }
}

function parseMoneyInput(value: string) {
  const numeric = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

export default function MockCardPaymentGate({
  title,
  description,
  amountDue,
  currency = "LKR",
  errorMessage = null,
  actionLabel = "Validate payment",
  onPaid,
}: MockCardPaymentGateProps) {
  const resolvedCurrency = currency ?? "USD";
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<MockCardPaymentReceipt | null>(
    null
  );

  useEffect(() => {
    setAmountInput(amountDue == null ? "" : amountDue.toFixed(2));
    setPaymentError(null);
    setPaymentReceipt(null);
    setProcessing(false);
  }, [amountDue, currency, title]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (amountDue == null) {
      setPaymentError("The amount due is unavailable. Please try again.");
      return;
    }

    const enteredAmount = parseMoneyInput(amountInput);
    if (enteredAmount == null) {
      setPaymentError("Enter the payment amount to continue.");
      return;
    }

    const expectedCents = Math.round(amountDue * 100);
    const enteredCents = Math.round(enteredAmount * 100);
    if (enteredCents !== expectedCents) {
      const difference = Math.abs(expectedCents - enteredCents) / 100;
      setPaymentError(
        `Enter the exact amount of ${formatMoney(
          amountDue,
          resolvedCurrency
        )}. Difference: ${formatMoney(difference, resolvedCurrency)}.`
      );
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s+/g, "");
    const cardMonth = Number(expiryMonth);
    const cardYear = Number(expiryYear);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (!cardholderName.trim()) {
      setPaymentError("Enter the cardholder name.");
      return;
    }

    if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
      setPaymentError("Enter a valid card number.");
      return;
    }

    if (!Number.isInteger(cardMonth) || cardMonth < 1 || cardMonth > 12) {
      setPaymentError("Enter a valid expiry month.");
      return;
    }

    if (!Number.isInteger(cardYear) || cardYear < currentYear) {
      setPaymentError("The card expiry date is invalid.");
      return;
    }

    if (cardYear === currentYear && cardMonth < currentMonth) {
      setPaymentError("The card has expired.");
      return;
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      setPaymentError("Enter a valid CVC.");
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const receipt: MockCardPaymentReceipt = {
        amount: amountDue,
        currency: resolvedCurrency,
        cardBrand: "Visa",
        cardLast4: cleanedCardNumber.slice(-4),
        paidAt: new Date().toISOString(),
      };
      setPaymentReceipt(receipt);
      await onPaid?.(receipt);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-b-[2rem] bg-white">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Payment step
        </div>
        <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <form className="space-y-4 p-5 sm:p-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            Amount due
          </div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
            {amountDue == null ? "-" : formatMoney(amountDue, resolvedCurrency)}
          </div>
          <div className="mt-1 text-sm text-sky-900">
            Enter the exact penalty amount to pass the mock payment check.
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-6">
          <label className="block sm:col-span-3">
            <span className="text-sm font-semibold text-slate-700">Cardholder name</span>
            <input
              value={cardholderName}
              onChange={(event) => setCardholderName(event.target.value)}
              type="text"
              placeholder="Customer name"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-3">
            <span className="text-sm font-semibold text-slate-700">Card number</span>
            <input
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              type="text"
              inputMode="numeric"
              placeholder="Enter card number"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Expiry month</span>
            <input
              value={expiryMonth}
              onChange={(event) => setExpiryMonth(event.target.value)}
              type="text"
              inputMode="numeric"
              placeholder="12"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Expiry year</span>
            <input
              value={expiryYear}
              onChange={(event) => setExpiryYear(event.target.value)}
              type="text"
              inputMode="numeric"
              placeholder="2028"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">CVC</span>
            <input
              value={cvc}
              onChange={(event) => setCvc(event.target.value)}
              type="text"
              inputMode="numeric"
              placeholder="123"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block sm:col-span-6">
            <span className="text-sm font-semibold text-slate-700">Payment amount</span>
            <div className="relative mt-1">
              <input
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                {resolvedCurrency}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Use the exact due amount shown above or the payment will fail.
            </p>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {processing ? "Checking payment..." : actionLabel}
          </button>
        </div>

        {paymentError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {paymentError}
          </div>
        ) : null}

        {paymentReceipt ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="font-semibold text-emerald-900">Payment approved</div>
            <div className="mt-1">
              Receipt amount: {formatMoney(paymentReceipt.amount, paymentReceipt.currency)}
            </div>
            <div className="mt-1">
              Card: {paymentReceipt.cardBrand} ending {paymentReceipt.cardLast4}
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}
