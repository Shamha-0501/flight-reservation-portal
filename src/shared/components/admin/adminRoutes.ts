import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  BadgePercent,
  LayoutDashboard,
  Plane,
  Package,
  Settings,
  TicketX,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavAudience = "all" | "platform" | "tenant";

export type AdminNavItem = {
  title: string;
  href: string;
  match: string;
  tenantHref?: string;
  tenantMatch?: string;
  icon: LucideIcon;
  description: string;
  audience: AdminNavAudience;
  requiresTenantLeadership?: boolean;
  requiresTenantOwner?: boolean;
  requiresPlatformAdmin?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    match: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Monitor portal activity, requests, and revenue.",
    audience: "all",
  },
  {
    title: "Flight Bookings",
    href: "/admin/bookings",
    match: "/admin/bookings",
    icon: Plane,
    description: "Review flight reservations, booking status, and customer records.",
    audience: "tenant",
  },
  {
    title: "Cancellation Requests",
    href: "/admin/cancellations",
    match: "/admin/cancellations",
    icon: TicketX,
    description: "Manage cancellation requests, refund status, and customer updates.",
    audience: "tenant",
  },
  {
    title: "Reschedule Requests",
    href: "/admin/reschedules",
    match: "/admin/reschedules",
    icon: CalendarClock,
    description: "Track reschedule requests, itinerary changes, and approvals.",
    audience: "tenant",
  },
  {
    title: "Add-ons",
    href: "/admin/addons",
    match: "/admin/addons",
    icon: Package,
    description: "Manage platform add-ons, workspace pricing, and customer-facing copy.",
    audience: "all",
    requiresTenantOwner: true,
  },
  {
    title: "Markup",
    href: "/admin/markup",
    match: "/admin/markup",
    icon: BadgePercent,
    description: "Set the booking markup applied on top of the live fare.",
    audience: "all",
    requiresTenantOwner: true,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    match: "/admin/customers",
    icon: Users,
    description: "View customer profiles, booking history, and account activity.",
    audience: "tenant",
  },
  {
    title: "Agencies",
    href: "/admin/agencies",
    match: "/admin/agencies",
    icon: CircleDollarSign,
    description: "Manage travel agencies, tenant access, and operational settings.",
    audience: "platform",
  },
  {
    title: "Team Members",
    href: "/admin/users",
    match: "/admin/users",
    icon: Users,
    description: "Invite tenant owners, admins, managers, and staff into this workspace.",
    audience: "tenant",
    requiresTenantLeadership: true,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    match: "/admin/reports",
    tenantHref: "/admin/tenant/reports",
    tenantMatch: "/admin/tenant/reports",
    icon: BarChart3,
    description: "Analyze platform-wide or tenant-scoped bookings, refunds, revenue, and performance.",
    audience: "all",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    match: "/admin/settings",
    icon: Settings,
    description: "Configure tenant preferences, portal options, and admin controls.",
    audience: "all",
  },
];
