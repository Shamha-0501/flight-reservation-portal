"use client";

import type { BookingListItem } from "@/src/api/routes/orders/bookings";

const STORAGE_KEY = "booking-status-overrides";
export const BOOKING_STATUS_OVERRIDE_EVENT = "booking-status-override-updated";

type BookingStatusOverrideMap = Record<string, string>;

function buildKeys(bookingId?: string | number | null, duffelOrderId?: string | null) {
  const keys: string[] = [];

  if (bookingId != null && bookingId !== "") {
    keys.push(`booking:${String(bookingId)}`);
  }

  if (duffelOrderId) {
    keys.push(`duffel:${duffelOrderId}`);
  }

  return keys;
}

function readOverrides(): BookingStatusOverrideMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as BookingStatusOverrideMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: BookingStatusOverrideMap) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(BOOKING_STATUS_OVERRIDE_EVENT));
}

export function getBookingStatusOverride(
  bookingId?: string | number | null,
  duffelOrderId?: string | null
) {
  const overrides = readOverrides();

  for (const key of buildKeys(bookingId, duffelOrderId)) {
    const value = overrides[key];
    if (value) return value;
  }

  return null;
}

export function setBookingStatusOverride(params: {
  bookingId?: string | number | null;
  duffelOrderId?: string | null;
  status: string;
}) {
  const overrides = readOverrides();

  for (const key of buildKeys(params.bookingId, params.duffelOrderId)) {
    overrides[key] = params.status;
  }

  writeOverrides(overrides);
}

export function applyBookingStatusOverride<T extends BookingListItem | null>(
  booking: T
): T {
  if (!booking) return booking;

  const override = getBookingStatusOverride(booking.id, booking.duffel_order_id);
  if (!override) return booking;

  return {
    ...booking,
    status: override,
  };
}

export function applyBookingStatusOverrides(items: BookingListItem[]) {
  return items.map((item) => applyBookingStatusOverride(item));
}
