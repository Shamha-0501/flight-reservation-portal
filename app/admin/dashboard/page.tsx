"use client";

import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  ChartNoAxesColumn,
  Clock3,
  Plane,
  ReceiptText,
  TicketX,
  Users,
  WalletCards,
} from "lucide-react";
import {
  getAdminActivities,
  getAdminDashboard,
  type AdminActivityLog,
  type AdminDashboardPayload,
} from "@/src/api/routes/admin/dashboard";
import {
  getTenantActivities,
  getTenantDashboard,
  type TenantActivityLog,
  type TenantDashboardPayload,
} from "@/src/api/routes/tenant/dashboard";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  AdminButton,
  LoadingSkeleton,
  PaginationPlaceholder,
  StatCard,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { adminStats, bookings, recentActivity } from "@/src/shared/components/admin/adminData";

const statIcons = [
  { icon: Plane, iconTone: "bg-blue-50 text-blue-600" },
  { icon: ChartNoAxesColumn, iconTone: "bg-emerald-50 text-emerald-600" },
  { icon: TicketX, iconTone: "bg-rose-50 text-rose-600" },
  { icon: ReceiptText, iconTone: "bg-amber-50 text-amber-600" },
  { icon: CalendarClock, iconTone: "bg-sky-50 text-sky-600" },
  { icon: Users, iconTone: "bg-teal-50 text-teal-600" },
  { icon: WalletCards, iconTone: "bg-indigo-50 text-indigo-600" },
  { icon: BadgeDollarSign, iconTone: "bg-violet-50 text-violet-600" },
] as const;

export default function AdminDashboardPage() {
  const { isPlatformAdmin, selectedTenant } = useAuth();
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardPayload | null>(null);
  const [adminActivities, setAdminActivities] = useState<AdminActivityLog[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<TenantDashboardPayload | null>(null);
  const [activities, setActivities] = useState<TenantActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPlatformAdmin) {
      let active = true;

      async function loadAdminDashboard() {
        setAdminLoading(true);
        setAdminError(null);

        try {
          const [dashboardResponse, activitiesResponse] = await Promise.all([
            getAdminDashboard(),
            getAdminActivities({ per_page: 20 }),
          ]);

          if (!active) return;

          setAdminDashboard(dashboardResponse);
          setAdminActivities(Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);
        } catch (requestError) {
          if (!active) return;

          setAdminDashboard(null);
          setAdminActivities([]);
          setAdminError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load admin dashboard.",
          );
        } finally {
          if (active) {
            setAdminLoading(false);
          }
        }
      }

      loadAdminDashboard();

      return () => {
        active = false;
      };
    }

    const tenantKey = selectedTenant?.key ?? "";

    if (!tenantKey) {
      setDashboard(null);
      setActivities([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadTenantDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardResponse, activitiesResponse] = await Promise.all([
          getTenantDashboard(tenantKey),
          getTenantActivities({ tenantKey, per_page: 20 }),
        ]);

        if (!active) return;

        setDashboard(dashboardResponse);
        setActivities(Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load tenant dashboard.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTenantDashboard();

    return () => {
      active = false;
    };
  }, [isPlatformAdmin, selectedTenant?.key]);

  const tenantStats = dashboard?.stats;
  const platformStats = adminDashboard?.stats;
  const dashboardStats = isPlatformAdmin
    ? platformStats
      ? [
          {
            label: "Total Bookings",
            value: formatNumber(platformStats.total_bookings),
            note: "Platform-wide reservations",
          },
          {
            label: "Active Bookings",
            value: formatNumber(platformStats.active_bookings),
            note: "Bookings still in progress",
          },
          {
            label: "Cancellation Requests",
            value: formatNumber(platformStats.cancellation_requests),
            note: "Pending cancellation handling",
          },
          {
            label: "Refund Pending",
            value: formatNumber(platformStats.refund_pendings),
            note: "Refunds awaiting completion",
          },
          {
            label: "Reschedule Requests",
            value: formatNumber(platformStats.reschedule_requests),
            note: "Itinerary changes in review",
          },
          {
            label: "Customers",
            value: formatNumber(platformStats.customers),
            note: "Unique traveler accounts",
          },
          {
            label: "Revenue",
            value: formatMoney(platformStats.revenue.amount, platformStats.revenue.currency),
            note: "Gross platform revenue",
          },
          {
            label: "Agencies",
            value: formatNumber(platformStats.agencies),
            note: "Registered travel agencies",
          },
        ]
      : adminStats
    : [
        {
          label: "Total Bookings",
          value: formatNumber(tenantStats?.total_bookings),
          note: "All bookings for this tenant",
        },
        {
          label: "Active Bookings",
          value: formatNumber(tenantStats?.active_bookings),
          note: "Non-cancelled booking records",
        },
        {
          label: "Cancellation Requests",
          value: formatNumber(tenantStats?.cancellation_requests),
          note: "Awaiting cancellation completion",
        },
        {
          label: "Refund Pending",
          value: formatNumber(tenantStats?.refund_pendings),
          note: "Orders pending refund completion",
        },
        {
          label: "Reschedule Requests",
          value: formatNumber(tenantStats?.reschedule_requests),
          note: "Pending order change requests",
        },
        {
          label: "Customers",
          value: formatNumber(tenantStats?.customers),
          note: "Distinct customers in this tenant",
        },
        {
          label: "Revenue",
          value: formatMoney(tenantStats?.revenue?.amount, tenantStats?.revenue?.currency),
          note: "Gross order value in LKR",
        },
      ];
  const recentBookings = isPlatformAdmin
    ? adminDashboard?.recent_bookings ?? bookings.slice(0, 5)
    : dashboard?.recent_bookings ?? [];
  const recentTenantActivities = isPlatformAdmin
    ? adminActivities.length
      ? adminActivities
      : recentActivity
    : activities;
  const trendPoints = isPlatformAdmin ? adminDashboard?.trend?.points ?? [] : dashboard?.trend?.points ?? [];

  return (
    <AdminPage
      title="Portal overview"
      description={
        isPlatformAdmin
          ? "Track booking operations, customer movements, agency approvals, and revenue across the platform."
          : `Track booking operations, customer movements, and workspace activity for ${selectedTenant?.name ?? "this tenant"}.`
      }
      actions={
        <>
          <AdminButton variant="secondary">Download Snapshot</AdminButton>
          <AdminButton>{isPlatformAdmin ? "Review Agencies" : "New Booking"}</AdminButton>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <SurfaceCard
          title="Weekly booking trend"
          description={
            isPlatformAdmin
              ? "Platform trend data comes from the admin dashboard API."
              : `Last 7 days of booking activity for ${selectedTenant?.name ?? "this tenant"}.`
          }
        >
          {isPlatformAdmin ? (
            adminLoading ? (
              <LoadingSkeleton />
            ) : (
              <DashboardTrendChart
                points={trendPoints}
                revenueLabel={formatMoney(
                  platformStats?.revenue.amount,
                  platformStats?.revenue.currency,
                )}
              />
            )
          ) : loading ? (
            <LoadingSkeleton />
          ) : (
            <DashboardTrendChart
              points={trendPoints}
              revenueLabel={formatMoney(tenantStats?.revenue?.amount, tenantStats?.revenue?.currency)}
            />
          )}
        </SurfaceCard>

        <SurfaceCard
          title="Operations snapshot"
          description={
            isPlatformAdmin
              ? "Quick signals from the platform dashboard."
              : "Quick signals from the current tenant workspace."
          }
        >
          <div className="space-y-3">
            <SnapshotRow
              icon={Plane}
              label="Bookings this week"
              value={String(trendPoints.reduce((sum, point) => sum + point.bookings, 0))}
            />
            <SnapshotRow
              icon={TicketX}
              label="Cancellation requests"
              value={formatNumber(
                isPlatformAdmin ? platformStats?.cancellation_requests : tenantStats?.cancellation_requests,
              )}
            />
            <SnapshotRow
              icon={ReceiptText}
              label="Refund pending"
              value={formatNumber(
                isPlatformAdmin ? platformStats?.refund_pendings : tenantStats?.refund_pendings,
              )}
            />
            <SnapshotRow
              icon={Clock3}
              label="Recent window"
              value={
                isPlatformAdmin
                  ? adminDashboard?.recent_bookings_window?.limit
                    ? `${adminDashboard.recent_bookings_window.limit} bookings`
                    : "0 bookings"
                  : dashboard?.recent_bookings_window?.limit
                    ? `${dashboard.recent_bookings_window.limit} bookings`
                    : "0 bookings"
              }
            />
          </div>
        </SurfaceCard>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardStats.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            note={card.note}
            icon={statIcons[index]?.icon}
            iconTone={statIcons[index]?.iconTone}
          />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <SurfaceCard
          title="Recent Bookings"
          description={
            isPlatformAdmin
              ? "Latest reservations across the selected tenant."
              : "Last 10 bookings created within the last month for this tenant."
          }
        >
          <TableShell
            columns={[
              "Booking Ref",
              "Customer",
              "Route",
              "Travel Date",
              "Status",
              "Amount",
            ]}
          >
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                  {"bookingRef" in booking ? booking.bookingRef : booking.booking_reference ?? "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {"customer" in booking ? booking.customer : booking.user?.name ?? booking.user?.email ?? "Guest"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {"route" in booking ? booking.route : getBookingRoute(booking)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {"travelDate" in booking ? booking.travelDate : getBookingTravelDate(booking)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge value={booking.status ?? "Unknown"} />
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                  {"amount" in booking
                    ? booking.amount
                    : formatMoney(
                        booking.amounts?.total?.amount,
                        booking.amounts?.total?.currency,
                      )}
                </td>
              </tr>
            ))}
          </TableShell>
          <div className="mt-4">
            <PaginationPlaceholder />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Recent Activity"
          description="A live operations snapshot for bookings, refunds, changes, and tenant actions."
        >
          <div className="space-y-4">
            {isPlatformAdmin && adminLoading ? (
              <LoadingSkeleton />
            ) : null}
            {!isPlatformAdmin && loading ? (
              <LoadingSkeleton />
            ) : null}
            {isPlatformAdmin && adminError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {adminError}
              </div>
            ) : null}
            {!isPlatformAdmin && error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {recentTenantActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {"detail" in activity ? activity.title : activity.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {"detail" in activity ? activity.detail : activity.description ?? activity.action}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    {"time" in activity ? activity.time : formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatMoney(amount?: string | number | null, currency?: string | null) {
  const numericAmount = Number(amount ?? 0);
  const code = currency || "LKR";

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

function getBookingRoute(booking: TenantDashboardPayload["recent_bookings"][number]) {
  const slices =
    ((booking.meta?.offer as { slices?: Array<{ origin?: { iata_code?: string }; destination?: { iata_code?: string } }> } | null)
      ?.slices) ?? [];

  const firstSlice = slices[0];

  if (firstSlice?.origin?.iata_code && firstSlice?.destination?.iata_code) {
    return `${firstSlice.origin.iata_code} -> ${firstSlice.destination.iata_code}`;
  }

  return "Route unavailable";
}

function getBookingTravelDate(booking: TenantDashboardPayload["recent_bookings"][number]) {
  const slices =
    ((booking.meta?.offer as { slices?: Array<{ departure_date?: string }> } | null)?.slices) ?? [];
  const departureDate = slices[0]?.departure_date;

  return departureDate ?? booking.created_at ?? "N/A";
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
      </div>
    </div>
  );
}

function DashboardTrendChart({
  points,
  revenueLabel,
}: {
  points: TenantDashboardPayload["trend"]["points"];
  revenueLabel: string;
}) {
  if (!points.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        No booking trend data available yet.
      </div>
    );
  }

  const maxBookings = Math.max(...points.map((point) => point.bookings), 1);
  const bookingPath = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point.bookings / maxBookings) * 100;
      return `${index === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric
          label="7-day bookings"
          value={String(points.reduce((sum, point) => sum + point.bookings, 0))}
        />
        <MiniMetric
          label="7-day cancellations"
          value={String(points.reduce((sum, point) => sum + point.cancellations, 0))}
        />
        <MiniMetric label="Revenue" value={revenueLabel} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <svg viewBox="0 0 100 100" className="h-48 w-full overflow-visible">
          <defs>
            <linearGradient id="bookingTrend" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <path
            d="M 0,100 L 0,100"
            fill="none"
            stroke="transparent"
          />
          <path
            d={`${bookingPath} L 100,100 L 0,100 Z`}
            fill="rgba(37,99,235,0.10)"
            stroke="none"
          />
          <path
            d={bookingPath}
            fill="none"
            stroke="url(#bookingTrend)"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => {
            const x = (index / Math.max(points.length - 1, 1)) * 100;
            const y = 100 - (point.bookings / maxBookings) * 100;

            return (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                r="2.2"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        <div className="mt-3 grid grid-cols-7 gap-2 text-center">
          {points.map((point) => (
            <div key={point.date}>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                {point.label}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{point.bookings}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}
