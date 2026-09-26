const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatDateDetails,
  formatMoneyDetails,
  getWorkflowState,
  normalizeStatusDetails,
  parseNumericAmount,
} = require("./bookingDetails.helpers");

test("parses numeric amounts from formatted strings", () => {
  assert.equal(parseNumericAmount("USD 45.50"), 45.5);
  assert.equal(parseNumericAmount("$1,234.50"), 1234.5);
  assert.equal(parseNumericAmount("abc"), null);
});

test("normalizes workflow status values", () => {
  assert.equal(normalizeStatusDetails("  APPROVED "), "approved");
});

test("formats money and invalid dates in the booking details view", () => {
  assert.equal(formatMoneyDetails(15, "USD"), "$15.00");
  assert.equal(formatDateDetails("invalid-date"), "-");
});

test("maps workflow state to requested status", () => {
  const workflow = getWorkflowState(
    {
      meta: {
        change: {
          status: "change requested",
          requested_at: "2026-07-01T10:00:00Z",
        },
      },
    },
    "change"
  );

  assert.equal(workflow.status, "requested");
  assert.equal(workflow.requestedAt, "2026-07-01T10:00:00Z");
});

test("maps cancellation workflow to approved status and exposes notes", () => {
  const workflow = getWorkflowState(
    {
      meta: {
        cancellation: {
          status: "pending_confirmation",
          approved_at: "2026-07-02T09:30:00Z",
          approval_note: "Approved by support",
        },
      },
    },
    "cancellation"
  );

  assert.equal(workflow.status, "approved");
  assert.equal(workflow.approvedAt, "2026-07-02T09:30:00Z");
  assert.equal(workflow.reviewNote, "Approved by support");
});

test("returns rejection details and null-safe fields", () => {
  const workflow = getWorkflowState(
    {
      meta: {
        cancellation: {
          status: "rejected",
          rejected_at: "2026-07-03T08:00:00Z",
          rejection_reason: "Route already unavailable",
        },
      },
    },
    "cancellation"
  );

  assert.equal(workflow.status, "rejected");
  assert.equal(workflow.rejectedAt, "2026-07-03T08:00:00Z");
  assert.equal(workflow.reviewNote, "Route already unavailable");
});
