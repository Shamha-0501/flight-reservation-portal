import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      summary="Learn how refunds are reviewed, approved, and returned for eligible flight reservations."
      sections={[
        {
          heading: "Refund eligibility",
          body: [
            "Refunds depend on the airline fare rules, cancellation status, and whether the booking was partially used.",
            "Some fares are non-refundable or may only return taxes and selected charges.",
          ],
        },
        {
          heading: "Processing time",
          body: [
            "After approval, refunds can take several business days to appear depending on the payment method and the financial institution.",
            "If additional verification is needed, the refund may remain in review until the required checks are completed.",
          ],
        },
        {
          heading: "Partial refunds",
          body: [
            "If only part of the itinerary is cancelled or a fee applies, the final refund amount may be lower than the original payment.",
          ],
        },
      ]}
    />
  );
}
