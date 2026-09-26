function formatMoney(amount, currency) {
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

function formatDate(value) {
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

function normalizeStatus(value) {
  return (value ?? "").toLowerCase().trim();
}

function getAgencyLabel(item) {
  return (
    item.tenant?.name?.trim() ||
    item.tenant_name?.trim() ||
    item.tenant_key?.trim() ||
    (item.tenant_id ? `Agency #${item.tenant_id}` : "") ||
    "Agency unavailable"
  );
}

function getBookingDisplayState(item) {
  const rescheduleStatus = normalizeStatus(item.meta?.change?.status);
  const cancellationStatus = normalizeStatus(item.meta?.cancellation?.status);
  const refundStatus = normalizeStatus(item.refund_status);
  const status = normalizeStatus(item.status);

  if (refundStatus === "refunded" || status === "refunded") {
    return { key: "refunded", label: "Refunded" };
  }

  if (cancellationStatus === "cancelled") {
    if (refundStatus === "refund pending") {
      return { key: "refund-pending", label: "Cancelled · Refund Pending" };
    }

    if (refundStatus === "refund unknown") {
      return { key: "refund-unknown", label: "Cancelled · Refund Unknown" };
    }

    if (refundStatus === "no refund") {
      return { key: "cancelled-no-refund", label: "Cancelled · No Refund" };
    }

    return { key: "cancelled", label: "Cancelled" };
  }

  if (cancellationStatus === "cancellation requested" || status === "cancellation requested") {
    return { key: "cancellation-requested", label: "Cancellation Requested" };
  }

  if (cancellationStatus === "approved") {
    return { key: "cancellation-approved", label: "Cancellation Approved" };
  }

  if (cancellationStatus === "rejected") {
    return { key: "cancellation-rejected", label: "Cancellation Not Permitted" };
  }

  if (rescheduleStatus === "requested") {
    return { key: "reschedule-requested", label: "Reschedule Requested" };
  }

  if (rescheduleStatus === "approved") {
    return { key: "reschedule-approved", label: "Reschedule Approved" };
  }

  if (rescheduleStatus === "rejected") {
    return { key: "reschedule-rejected", label: "Reschedule Not Permitted" };
  }

  if (status === "rescheduled" || status === "changed") {
    return { key: "rescheduled", label: "Rescheduled" };
  }

  if (status === "created" || status === "booked" || status === "confirmed") {
    return { key: "booked", label: "Booked" };
  }

  if (status === "pending") {
    return { key: "pending", label: "Pending" };
  }

  return {
    key: status || "unknown",
    label: item.status || "Unknown",
  };
}

module.exports = {
  formatMoney,
  formatDate,
  normalizeStatus,
  getAgencyLabel,
  getBookingDisplayState,
};
