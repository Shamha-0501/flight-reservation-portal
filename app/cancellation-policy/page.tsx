import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function CancellationPolicyPage() {
  return (
    <PolicyPage
      title="Cancellation Policy"
      summary="This page explains how cancellation requests are handled for reservations made through Flight Portal."
      sections={[
        {
          heading: "Requesting a cancellation",
          body: [
            "Cancellation availability depends on the fare rules, airline policy, and booking stage.",
            "Some bookings may be eligible for instant cancellation, while others may require manual review or airline approval.",
          ],
        },
        {
          heading: "Timing and status",
          body: [
            "If a cancellation is requested close to departure or after ticketing rules have closed, the booking may not be eligible for cancellation.",
            "Once a request is submitted, the booking status may show as pending, approved, rejected, or cancelled depending on the outcome.",
          ],
        },
        {
          heading: "Refund impact",
          body: [
            "Cancellation does not always mean a refund. The refundable amount depends on the fare type, airline rules, and any applicable fees.",
          ],
        },
      ]}
    />
  );
}
