export function isExpiredOfferMessage(message?: string | null): boolean {
  if (!message) return false;

  const normalized = message.toLowerCase();

  return (
    normalized.includes("expired") ||
    normalized.includes("no longer available") ||
    normalized.includes("offer is no longer available")
  );
}

export function getExpiredOfferMessage() {
  return "This flight offer has expired. Please go back to the search results and select a fresh offer before continuing.";
}
