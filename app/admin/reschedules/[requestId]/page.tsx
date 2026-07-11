import { AdminButton, AdminPage, EmptyState, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default async function RescheduleDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <AdminPage
      title={`Reschedule ${requestId}`}
      description="Duffel reschedules are now driven from booking details, where the available change offers are requested and confirmed."
      eyebrow="Reschedule details"
      actions={
        <>
          <AdminButton variant="secondary" href="/bookings">
            Open bookings
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Workflow status">
          <EmptyState
            title="No standalone reschedule record"
            description="Use a booking record to review changeability, request Duffel offers, and confirm the itinerary change. This route remains as a pointer for legacy navigation."
          />
        </SurfaceCard>

        <SurfaceCard title="What changed">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Reschedule requests are no longer mocked in this area.</p>
            <p>The booking details page now performs the Duffel changeability check and offers selection flow.</p>
            <p>After confirmation, the booking record should reflect the updated status from the backend.</p>
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}
