import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function HelpCenterPage() {
  return (
    <PolicyPage
      title="Help Center"
      summary="Find quick answers for searching flights, managing bookings, and resolving common reservation issues."
      sections={[
        {
          heading: "Before you book",
          body: [
            "Use the flight search bar to compare routes, fares, and booking options before confirming payment.",
            "Check baggage rules, fare conditions, and passenger details carefully before finalizing a reservation.",
          ],
        },
        {
          heading: "Managing bookings",
          body: [
            "Open your booking history to review status, booking reference, payment totals, and support actions.",
            "If a booking needs a change or cancellation, use the reservation details page to see what is available for that fare.",
          ],
        },
        {
          heading: "Need immediate support?",
          body: [
            "If you are unable to access a booking or need help with a travel issue, contact support and include your booking reference and email address.",
          ],
        },
      ]}
    />
  );
}
