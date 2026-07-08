import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  LayoutDashboard,
  Plane,
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
  icon: LucideIcon;
  description: string;
  audience: AdminNavAudience;
  requiresTenantLeadership?: boolean;
  requiresTenantOwner?: boolean;
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
    icon: BarChart3,
    description: "Analyze bookings, refunds, revenue, and portal performance.",
    audience: "platform",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    match: "/admin/settings",
    icon: Settings,
    description: "Configure tenant preferences, portal options, and admin controls.",
    audience: "all",
    requiresTenantOwner: true,
  },
];
