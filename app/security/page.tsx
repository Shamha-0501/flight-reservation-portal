import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function SecurityPage() {
  return (
    <PolicyPage
      title="Security"
      summary="Flight Portal uses protected booking views and account controls to keep travel data handled carefully."
      sections={[
        {
          heading: "Account access",
          body: [
            "Access to bookings is tied to your account email and the authenticated session that loaded your reservation history.",
            "Do not share your booking reference or account credentials with untrusted parties.",
          ],
        },
        {
          heading: "Protected records",
          body: [
            "Reservation details, payment summaries, and support actions are displayed inside a secure portal layout.",
            "Sensitive changes may require additional confirmation depending on the booking action.",
          ],
        },
        {
          heading: "Safer usage",
          body: [
            "Sign out on shared devices and contact support if you suspect unauthorized access to your account.",
          ],
        },
      ]}
    />
  );
}
