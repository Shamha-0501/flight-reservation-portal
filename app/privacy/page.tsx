import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      summary="This page explains the types of information Flight Portal handles and how it is used to manage reservations."
      sections={[
        {
          heading: "Information used for bookings",
          body: [
            "We may use your name, email address, booking reference, and related reservation details to display and manage your bookings.",
            "Travel records are shown so you can review status, payments, and support options from one place.",
          ],
        },
        {
          heading: "Why the data is used",
          body: [
            "The portal uses booking data to provide account access, reservation history, and customer support responses.",
            "Data may also be used to improve search, booking, and post-booking workflows.",
          ],
        },
        {
          heading: "Your control",
          body: [
            "If any booking information is inaccurate, contact support so the team can review the record and advise on next steps.",
          ],
        },
      ]}
    />
  );
}
