import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  LayoutDashboard,
  Plane,
  Settings,
  TicketX,
  Users,
} from "lucide-react";

export const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    match: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Monitor portal activity, requests, and revenue.",
  },
  {
    title: "Flight Bookings",
    href: "/admin/bookings",
    match: "/admin/bookings",
    icon: Plane,
    description: "Review flight reservations, booking status, and customer records.",
  },
  {
    title: "Cancellation Requests",
    href: "/admin/cancellations",
    match: "/admin/cancellations",
    icon: TicketX,
    description: "Manage cancellation requests, refund status, and customer updates.",
  },
  {
    title: "Reschedule Requests",
    href: "/admin/reschedules",
    match: "/admin/reschedules",
    icon: CalendarClock,
    description: "Track reschedule requests, itinerary changes, and approvals.",
  },
  {
    title: "Customers",
    href: "/admin/customers",
    match: "/admin/customers",
    icon: Users,
    description: "View customer profiles, booking history, and account activity.",
  },
  {
    title: "Agencies",
    href: "/admin/agencies",
    match: "/admin/agencies",
    icon: CircleDollarSign,
    description: "Manage travel agencies, tenant access, and operational settings.",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    match: "/admin/reports",
    icon: BarChart3,
    description: "Analyze bookings, refunds, revenue, and portal performance.",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    match: "/admin/settings",
    icon: Settings,
    description: "Configure tenant preferences, portal options, and admin controls.",
  },
] as const;

export type AdminNavItem = (typeof adminNavItems)[number];
