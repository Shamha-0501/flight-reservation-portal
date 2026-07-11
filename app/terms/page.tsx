import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms"
      summary="These terms describe how the Flight Portal service should be used and what to expect when making a reservation."
      sections={[
        {
          heading: "Using the portal",
          body: [
            "You agree to provide accurate passenger, contact, and payment information when using the booking flow.",
            "The portal may show flight options, booking statuses, and support actions based on airline and tenant data.",
          ],
        },
        {
          heading: "Account and booking responsibility",
          body: [
            "You are responsible for reviewing travel details before confirming a booking, including passenger names, dates, and route selection.",
            "Booking changes, cancellation eligibility, and refund outcomes are governed by the applicable fare and airline rules.",
          ],
        },
        {
          heading: "Service changes",
          body: [
            "We may update features, routes, or support flows to improve the reservation experience.",
          ],
        },
      ]}
    />
  );
}
