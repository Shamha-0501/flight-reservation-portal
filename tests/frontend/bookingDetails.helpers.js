function formatMoneyDetails(amount, currency) {
  if (amount == null) return "-";
  const numeric = Number(amount);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(safeAmount);
  } catch {
    return `${currency ?? ""} ${safeAmount.toFixed(2)}`.trim();
  }
}

function formatDateDetails(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseNumericAmount(value) {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value).replace(/[^0-9.-]+/g, "");
  if (!cleaned) return null;

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeStatusDetails(value) {
  return (value ?? "").toLowerCase().trim();
}

function getWorkflowState(order, kind) {
  const workflow = kind === "change" ? order?.meta?.change : order?.meta?.cancellation;
  const status = normalizeStatusDetails(typeof workflow?.status === "string" ? workflow.status : null);

  let normalizedStatus = status;
  if (normalizedStatus === "cancellation requested" || normalizedStatus === "change requested") {
    normalizedStatus = "requested";
  } else if (normalizedStatus === "pending_confirmation") {
    normalizedStatus = "approved";
  }

  return {
    status: normalizedStatus,
    requestedAt: typeof workflow?.requested_at === "string" ? workflow.requested_at : null,
    approvedAt: typeof workflow?.approved_at === "string" ? workflow.approved_at : null,
    rejectedAt: typeof workflow?.rejected_at === "string" ? workflow.rejected_at : null,
    reviewNote:
      typeof workflow?.approval_note === "string"
        ? workflow.approval_note
        : typeof workflow?.rejection_reason === "string"
          ? workflow.rejection_reason
          : null,
  };
}

module.exports = {
  formatMoneyDetails,
  formatDateDetails,
  parseNumericAmount,
  normalizeStatusDetails,
  getWorkflowState,
};
