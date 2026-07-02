import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  AdminButton,
  AdminPage,
  StatusBadge,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import { rescheduleRequests } from "@/src/shared/components/admin/adminData";

export default async function RescheduleDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const request = rescheduleRequests.find((item) => item.id === requestId);

  if (!request) notFound();

  return (
    <AdminPage
      title={`Reschedule ${request.bookingRef}`}
      description="Compare current and requested itineraries before confirming a change."
      eyebrow="Reschedule details"
      actions={
        <>
          <AdminButton variant="secondary">Approve</AdminButton>
          <AdminButton variant="ghost">Reject</AdminButton>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Current itinerary">
          <SimpleGrid rows={[["Booking Ref", request.bookingRef], ["Flight", request.currentFlight]]} />
        </SurfaceCard>
        <SurfaceCard title="Requested itinerary">
          <SimpleGrid rows={[["Customer", request.customer], ["Flight", request.requestedFlight]]} />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Fare comparison">
        <SimpleGrid
          rows={[
            ["Fare Difference", request.fareDifference],
            ["Status", request.status],
            ["Requested At", request.requestedAt],
          ]}
          highlightValue={<StatusBadge value={request.status} />}
        />
      </SurfaceCard>

      <SurfaceCard title="Status timeline">
        <div className="space-y-4">
          {request.timeline.map((item) => (
            <div key={item.label + item.timestamp} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold text-slate-950">{item.label}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.timestamp}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </AdminPage>
  );
}

function SimpleGrid({
  rows,
  highlightValue,
}: {
  rows: [string, string][];
  highlightValue?: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {label === "Status" && highlightValue ? highlightValue : value}
          </div>
        </div>
      ))}
    </div>
  );
}
