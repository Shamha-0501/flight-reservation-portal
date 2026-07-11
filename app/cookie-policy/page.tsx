import PolicyPage from "@/src/shared/components/legal/PolicyPage";

export default function CookiePolicyPage() {
  return (
    <PolicyPage
      title="Cookie Policy"
      summary="This page explains how browser cookies and similar technologies may be used on Flight Portal."
      sections={[
        {
          heading: "What cookies do",
          body: [
            "Cookies can help keep you signed in, remember preferences, and support a smoother booking experience.",
            "They may also help the portal understand basic usage so the interface can be improved over time.",
          ],
        },
        {
          heading: "How they are used",
          body: [
            "Cookies may support session handling, navigation, and non-sensitive analytics or performance checks.",
            "They are used to keep the portal practical for frequent searches and booking management.",
          ],
        },
        {
          heading: "Managing preferences",
          body: [
            "You can usually control cookies in your browser settings, though disabling them may affect sign-in or booking features.",
          ],
        },
      ]}
    />
  );
}
