const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatDate,
  formatMoney,
  getAgencyLabel,
  getBookingDisplayState,
  normalizeStatus,
} = require("./bookingDisplay.helpers");

test("formats money and invalid dates consistently", () => {
  assert.equal(formatMoney(123.456, "USD"), "$123.46");
  assert.equal(formatMoney(null, "USD"), "-");
  assert.equal(formatDate("invalid-date"), "-");
});

test("normalizes booking status labels", () => {
  assert.equal(normalizeStatus("  BOOKED "), "booked");
  assert.equal(normalizeStatus(undefined), "");
});

test("derives the booking status chip label from nested booking state", () => {
  const state = getBookingDisplayState({
    id: 1,
    tenant_id: 10,
    status: "Booked",
    refund_status: null,
    cancellation_status: null,
  });

  assert.deepEqual(state, { key: "booked", label: "Booked" });
});

test("maps cancellation and refund states to the expected labels", () => {
  assert.deepEqual(
    getBookingDisplayState({
      status: "cancelled",
      refund_status: "refund pending",
      meta: { cancellation: { status: "cancelled" } },
    }),
    { key: "refund-pending", label: "Cancelled · Refund Pending" }
  );

  assert.deepEqual(
    getBookingDisplayState({
      status: "refunded",
      refund_status: null,
      meta: {},
    }),
    { key: "refunded", label: "Refunded" }
  );

  assert.deepEqual(
    getBookingDisplayState({
      status: "cancelled",
      refund_status: "no refund",
      meta: { cancellation: { status: "cancelled" } },
    }),
    { key: "cancelled-no-refund", label: "Cancelled · No Refund" }
  );
});

test("maps reschedule and cancellation review states", () => {
  assert.deepEqual(
    getBookingDisplayState({
      status: "changed",
      meta: { change: { status: "requested" } },
    }),
    { key: "reschedule-requested", label: "Reschedule Requested" }
  );

  assert.deepEqual(
    getBookingDisplayState({
      status: "pending",
      meta: { cancellation: { status: "rejected" } },
    }),
    { key: "cancellation-rejected", label: "Cancellation Not Permitted" }
  );
});

test("prefers tenant name when deriving the agency label", () => {
  assert.equal(
    getAgencyLabel({
      id: 1,
      tenant_id: 10,
      tenant: { name: "SkyWay Travels" },
    }),
    "SkyWay Travels"
  );
});

test("falls back to a tenant id label when no agency name exists", () => {
  assert.equal(
    getAgencyLabel({
      id: 1,
      tenant_id: 24,
    }),
    "Agency #24"
  );
});

test("falls back through tenant_key and missing agency labels", () => {
  assert.equal(
    getAgencyLabel({
      tenant_key: "global-agency",
    }),
    "global-agency"
  );

  assert.equal(
    getAgencyLabel({
      id: 2,
    }),
    "Agency unavailable"
  );
});
