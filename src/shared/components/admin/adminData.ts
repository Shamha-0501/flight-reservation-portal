export type BookingStatus =
  | "Confirmed"
  | "Cancelled"
  | "Refund Pending"
  | "Refunded"
  | "Rescheduled"
  | "Completed";

export type CancellationStatus =
  | "Requested"
  | "Refunded"
  | "No Refund"
  | "Rejected";

export type RescheduleStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected";

export type CustomerStatus = "Active" | "VIP" | "Watchlist";
export type AgencyStatus = "Active" | "Pending" | "Paused";

export type BookingRecord = {
  id: string;
  bookingRef: string;
  customer: string;
  customerId: string;
  route: string;
  travelDate: string;
  passengers: number;
  amount: string;
  amountValue: number;
  status: BookingStatus;
  paymentMethod: string;
  bookedAt: string;
  duffelOrderId: string;
  timeline: { label: string; timestamp: string; tone: "info" | "success" | "warn" }[];
  passengersList: { name: string; type: string; seat: string; ticketNumber: string }[];
  flightDetails: {
    flightNumber: string;
    cabin: string;
    departure: string;
    arrival: string;
    terminal: string;
  };
};

export type CancellationRecord = {
  id: string;
  bookingRef: string;
  customer: string;
  refundAmount: string;
  refundStatus: "Refund Pending" | "Refunded" | "No Refund";
  cancellationDate: string;
  currentStatus: CancellationStatus;
  reason: string;
  notes: string;
};

export type RescheduleRecord = {
  id: string;
  bookingRef: string;
  customer: string;
  customerId: string;
  currentFlight: string;
  requestedFlight: string;
  fareDifference: string;
  status: RescheduleStatus;
  requestedAt: string;
  timeline: { label: string; timestamp: string; tone: "info" | "success" | "warn" }[];
};

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  completedTrips: number;
  cancelledTrips: number;
  status: CustomerStatus;
  tier: string;
  location: string;
  upcomingTrips: { route: string; date: string; bookingRef: string }[];
  cancelledTripsList: { route: string; date: string; bookingRef: string }[];
};

export type AgencyRecord = {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  totalBookings: number;
  revenue: string;
  revenueValue: number;
  status: AgencyStatus;
  city: string;
  address: string;
};

export const adminStats = [
  { label: "Total Bookings", value: "1,284", note: "+9.2% this month" },
  { label: "Active Bookings", value: "342", note: "Live upcoming itineraries" },
  { label: "Cancellation Requests", value: "18", note: "5 awaiting decision" },
  { label: "Refund Pending", value: "11", note: "LKR 418,000 in review" },
  { label: "Reschedule Requests", value: "14", note: "3 escalated cases" },
  { label: "Customers", value: "796", note: "112 premium travelers" },
  { label: "Revenue", value: "$184,320", note: "Net of completed refunds" },
  { label: "Agencies", value: "12", note: "9 active, 2 pending" },
] as const;

export const recentActivity = [
  { id: "act-1", title: "Booking Created", detail: "BK-48291 issued for Colombo to Dubai", time: "12 minutes ago" },
  { id: "act-2", title: "Cancellation Requested", detail: "BK-48218 requested partial refund review", time: "39 minutes ago" },
  { id: "act-3", title: "Refund Completed", detail: "BK-48176 refunded back to original card", time: "1 hour ago" },
  { id: "act-4", title: "Booking Rescheduled", detail: "BK-48054 moved to a later outbound flight", time: "2 hours ago" },
] as const;

export const bookings: BookingRecord[] = [
  {
    id: "ord_48291",
    bookingRef: "BK-48291",
    customer: "Ameera Nazeer",
    customerId: "cus_ameera_nazeer",
    route: "CMB -> DXB",
    travelDate: "2026-07-08",
    passengers: 2,
    amount: "$1,240",
    amountValue: 1240,
    status: "Confirmed",
    paymentMethod: "Visa ending 4242",
    bookedAt: "2026-06-29 14:20",
    duffelOrderId: "ord_dfl_48291",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-29 14:20", tone: "success" },
      { label: "Payment captured", timestamp: "2026-06-29 14:21", tone: "success" },
      { label: "Ticket issued", timestamp: "2026-06-29 14:26", tone: "info" },
    ],
    passengersList: [
      { name: "Ameera Nazeer", type: "Adult", seat: "14A", ticketNumber: "1762459031021" },
      { name: "M. Nazeer", type: "Child", seat: "14B", ticketNumber: "1762459031022" },
    ],
    flightDetails: {
      flightNumber: "EK 649",
      cabin: "Economy Flex",
      departure: "Colombo 02:55",
      arrival: "Dubai 05:45",
      terminal: "BIA T2 / DXB T3",
    },
  },
  {
    id: "ord_48264",
    bookingRef: "BK-48264",
    customer: "Lahiru Fernando",
    customerId: "cus_lahiru_fernando",
    route: "CMB -> SIN",
    travelDate: "2026-07-11",
    passengers: 1,
    amount: "$698",
    amountValue: 698,
    status: "Refund Pending",
    paymentMethod: "Mastercard ending 1821",
    bookedAt: "2026-06-28 09:10",
    duffelOrderId: "ord_dfl_48264",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-28 09:10", tone: "success" },
      { label: "Cancellation requested", timestamp: "2026-06-30 11:48", tone: "warn" },
      { label: "Refund review opened", timestamp: "2026-06-30 12:05", tone: "info" },
    ],
    passengersList: [
      { name: "Lahiru Fernando", type: "Adult", seat: "21C", ticketNumber: "1762459031124" },
    ],
    flightDetails: {
      flightNumber: "SQ 469",
      cabin: "Economy",
      departure: "Colombo 00:55",
      arrival: "Singapore 07:35",
      terminal: "BIA T2 / SIN T1",
    },
  },
  {
    id: "ord_48218",
    bookingRef: "BK-48218",
    customer: "Shenali Perera",
    customerId: "cus_shenali_perera",
    route: "CMB -> KUL",
    travelDate: "2026-07-15",
    passengers: 3,
    amount: "$1,512",
    amountValue: 1512,
    status: "Rescheduled",
    paymentMethod: "Amex ending 9932",
    bookedAt: "2026-06-27 16:42",
    duffelOrderId: "ord_dfl_48218",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-27 16:42", tone: "success" },
      { label: "Reschedule requested", timestamp: "2026-06-29 08:35", tone: "warn" },
      { label: "New itinerary confirmed", timestamp: "2026-06-29 10:02", tone: "success" },
    ],
    passengersList: [
      { name: "Shenali Perera", type: "Adult", seat: "18A", ticketNumber: "1762459031418" },
      { name: "Asanka Perera", type: "Adult", seat: "18B", ticketNumber: "1762459031419" },
      { name: "Ishani Perera", type: "Child", seat: "18C", ticketNumber: "1762459031420" },
    ],
    flightDetails: {
      flightNumber: "MH 180",
      cabin: "Economy Saver",
      departure: "Colombo 23:45",
      arrival: "Kuala Lumpur 06:10",
      terminal: "BIA T2 / KUL T1",
    },
  },
  {
    id: "ord_48176",
    bookingRef: "BK-48176",
    customer: "Ibrahim Fazil",
    customerId: "cus_ibrahim_fazil",
    route: "CMB -> DOH",
    travelDate: "2026-06-22",
    passengers: 1,
    amount: "$534",
    amountValue: 534,
    status: "Refunded",
    paymentMethod: "Visa ending 8890",
    bookedAt: "2026-06-21 20:15",
    duffelOrderId: "ord_dfl_48176",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-21 20:15", tone: "success" },
      { label: "Cancellation confirmed", timestamp: "2026-06-23 07:52", tone: "warn" },
      { label: "Refund completed", timestamp: "2026-06-24 15:20", tone: "success" },
    ],
    passengersList: [
      { name: "Ibrahim Fazil", type: "Adult", seat: "12D", ticketNumber: "1762459031550" },
    ],
    flightDetails: {
      flightNumber: "QR 669",
      cabin: "Economy Classic",
      departure: "Colombo 03:35",
      arrival: "Doha 05:55",
      terminal: "BIA T2 / DOH T1",
    },
  },
  {
    id: "ord_48131",
    bookingRef: "BK-48131",
    customer: "Kasuni Wijesinghe",
    customerId: "cus_kasuni_wijesinghe",
    route: "CMB -> BKK",
    travelDate: "2026-06-19",
    passengers: 2,
    amount: "$1,104",
    amountValue: 1104,
    status: "Completed",
    paymentMethod: "Visa ending 5513",
    bookedAt: "2026-06-14 11:00",
    duffelOrderId: "ord_dfl_48131",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-14 11:00", tone: "success" },
      { label: "Travel completed", timestamp: "2026-06-19 19:20", tone: "info" },
    ],
    passengersList: [
      { name: "Kasuni Wijesinghe", type: "Adult", seat: "9A", ticketNumber: "1762459031691" },
      { name: "Nimal Wijesinghe", type: "Adult", seat: "9B", ticketNumber: "1762459031692" },
    ],
    flightDetails: {
      flightNumber: "TG 308",
      cabin: "Economy Flex",
      departure: "Colombo 00:35",
      arrival: "Bangkok 06:05",
      terminal: "BIA T2 / BKK T1",
    },
  },
  {
    id: "ord_48054",
    bookingRef: "BK-48054",
    customer: "Nethmi Jayasinghe",
    customerId: "cus_nethmi_jayasinghe",
    route: "CMB -> DEL",
    travelDate: "2026-07-09",
    passengers: 1,
    amount: "$402",
    amountValue: 402,
    status: "Cancelled",
    paymentMethod: "Mastercard ending 2231",
    bookedAt: "2026-06-12 18:40",
    duffelOrderId: "ord_dfl_48054",
    timeline: [
      { label: "Booking created", timestamp: "2026-06-12 18:40", tone: "success" },
      { label: "Cancellation approved", timestamp: "2026-06-13 09:15", tone: "warn" },
    ],
    passengersList: [
      { name: "Nethmi Jayasinghe", type: "Adult", seat: "16F", ticketNumber: "1762459031745" },
    ],
    flightDetails: {
      flightNumber: "AI 272",
      cabin: "Economy",
      departure: "Colombo 09:20",
      arrival: "Delhi 13:05",
      terminal: "BIA T2 / DEL T3",
    },
  },
];

export const cancellationRequests: CancellationRecord[] = [
  {
    id: "can_1",
    bookingRef: "BK-48264",
    customer: "Lahiru Fernando",
    refundAmount: "$698",
    refundStatus: "Refund Pending",
    cancellationDate: "2026-06-30",
    currentStatus: "Requested",
    reason: "Client changed travel plan after visa appointment moved.",
    notes: "Airline penalty applies after 24-hour void window.",
  },
  {
    id: "can_2",
    bookingRef: "BK-48176",
    customer: "Ibrahim Fazil",
    refundAmount: "$512",
    refundStatus: "Refunded",
    cancellationDate: "2026-06-23",
    currentStatus: "Refunded",
    reason: "Medical emergency reported by traveler.",
    notes: "Refund completed to original card within 48 hours.",
  },
  {
    id: "can_3",
    bookingRef: "BK-48054",
    customer: "Nethmi Jayasinghe",
    refundAmount: "$0",
    refundStatus: "No Refund",
    cancellationDate: "2026-06-13",
    currentStatus: "No Refund",
    reason: "Promo fare was non-refundable.",
    notes: "Customer notified with carrier fare rules.",
  },
  {
    id: "can_4",
    bookingRef: "BK-47998",
    customer: "Aravind Kumar",
    refundAmount: "$420",
    refundStatus: "Refund Pending",
    cancellationDate: "2026-06-29",
    currentStatus: "Rejected",
    reason: "Duplicate cancellation request after departure.",
    notes: "Rejected due to post-departure policy restrictions.",
  },
];

export const rescheduleRequests: RescheduleRecord[] = [
  {
    id: "res_1",
    bookingRef: "BK-48218",
    customer: "Shenali Perera",
    customerId: "cus_shenali_perera",
    currentFlight: "MH 180 | 2026-07-15 23:45",
    requestedFlight: "MH 182 | 2026-07-16 08:10",
    fareDifference: "$126",
    status: "Approved",
    requestedAt: "2026-06-29 08:35",
    timeline: [
      { label: "Request submitted", timestamp: "2026-06-29 08:35", tone: "info" },
      { label: "Fare difference accepted", timestamp: "2026-06-29 09:15", tone: "success" },
      { label: "New ticket issued", timestamp: "2026-06-29 10:02", tone: "success" },
    ],
  },
  {
    id: "res_2",
    bookingRef: "BK-48204",
    customer: "Rizna Saleem",
    customerId: "cus_rizna_saleem",
    currentFlight: "EY 265 | 2026-07-12 03:25",
    requestedFlight: "EY 267 | 2026-07-12 19:10",
    fareDifference: "$84",
    status: "Pending Review",
    requestedAt: "2026-06-30 15:20",
    timeline: [
      { label: "Request submitted", timestamp: "2026-06-30 15:20", tone: "info" },
      { label: "Queued for airline review", timestamp: "2026-06-30 15:41", tone: "warn" },
    ],
  },
  {
    id: "res_3",
    bookingRef: "BK-48152",
    customer: "Aadil Ismail",
    customerId: "cus_aadil_ismail",
    currentFlight: "QR 663 | 2026-07-21 04:05",
    requestedFlight: "QR 667 | 2026-07-22 04:10",
    fareDifference: "$0",
    status: "Rejected",
    requestedAt: "2026-06-26 10:00",
    timeline: [
      { label: "Request submitted", timestamp: "2026-06-26 10:00", tone: "info" },
      { label: "Fare class unavailable", timestamp: "2026-06-26 11:25", tone: "warn" },
      { label: "Request rejected", timestamp: "2026-06-26 12:10", tone: "warn" },
    ],
  },
];

export const customers: CustomerRecord[] = [
  {
    id: "cus_ameera_nazeer",
    name: "Ameera Nazeer",
    email: "ameera.nazeer@example.com",
    phone: "+94 77 245 1302",
    totalBookings: 14,
    completedTrips: 11,
    cancelledTrips: 1,
    status: "VIP",
    tier: "Gold Traveller",
    location: "Colombo, Sri Lanka",
    upcomingTrips: [{ route: "CMB -> DXB", date: "2026-07-08", bookingRef: "BK-48291" }],
    cancelledTripsList: [{ route: "CMB -> MLE", date: "2026-03-17", bookingRef: "BK-47025" }],
  },
  {
    id: "cus_lahiru_fernando",
    name: "Lahiru Fernando",
    email: "lahiru.fernando@example.com",
    phone: "+94 71 902 1134",
    totalBookings: 6,
    completedTrips: 4,
    cancelledTrips: 1,
    status: "Active",
    tier: "Silver Traveller",
    location: "Negombo, Sri Lanka",
    upcomingTrips: [],
    cancelledTripsList: [{ route: "CMB -> SIN", date: "2026-07-11", bookingRef: "BK-48264" }],
  },
  {
    id: "cus_shenali_perera",
    name: "Shenali Perera",
    email: "shenali.perera@example.com",
    phone: "+94 76 881 4402",
    totalBookings: 9,
    completedTrips: 5,
    cancelledTrips: 0,
    status: "Active",
    tier: "Family Account",
    location: "Kandy, Sri Lanka",
    upcomingTrips: [{ route: "CMB -> KUL", date: "2026-07-16", bookingRef: "BK-48218" }],
    cancelledTripsList: [],
  },
  {
    id: "cus_ibrahim_fazil",
    name: "Ibrahim Fazil",
    email: "ibrahim.fazil@example.com",
    phone: "+94 75 340 5521",
    totalBookings: 3,
    completedTrips: 2,
    cancelledTrips: 1,
    status: "Watchlist",
    tier: "Standard",
    location: "Galle, Sri Lanka",
    upcomingTrips: [],
    cancelledTripsList: [{ route: "CMB -> DOH", date: "2026-06-22", bookingRef: "BK-48176" }],
  },
];

export const agencies: AgencyRecord[] = [
  {
    id: "agency_skyway",
    name: "SkyWay Travels",
    owner: "Fathima Shamha",
    email: "ops@skywaytravels.com",
    phone: "+94 11 230 4400",
    totalBookings: 412,
    revenue: "$58,420",
    revenueValue: 58420,
    status: "Active",
    city: "Colombo",
    address: "142 Galle Road, Colombo 03",
  },
  {
    id: "agency_blueorbit",
    name: "Blue Orbit Holidays",
    owner: "Harsha Jayasuriya",
    email: "owner@blueorbit.lk",
    phone: "+94 91 223 9180",
    totalBookings: 276,
    revenue: "$37,190",
    revenueValue: 37190,
    status: "Active",
    city: "Galle",
    address: "88 Pedlar Street, Galle Fort",
  },
  {
    id: "agency_pearlroute",
    name: "Pearl Route Agency",
    owner: "Nadeesha Wickramasinghe",
    email: "hello@pearlroute.com",
    phone: "+94 81 447 5100",
    totalBookings: 118,
    revenue: "$14,880",
    revenueValue: 14880,
    status: "Pending",
    city: "Kandy",
    address: "21 Temple Road, Kandy",
  },
  {
    id: "agency_coastaljet",
    name: "Coastal Jet Tours",
    owner: "Ashfaq Rahman",
    email: "admin@coastaljet.com",
    phone: "+94 41 336 9200",
    totalBookings: 82,
    revenue: "$9,760",
    revenueValue: 9760,
    status: "Paused",
    city: "Matara",
    address: "5 Beach Front Avenue, Matara",
  },
];

export const monthlyReportRows = [
  { month: "January", bookings: 168, revenue: "$21,400", cancellations: 9 },
  { month: "February", bookings: 174, revenue: "$23,960", cancellations: 11 },
  { month: "March", bookings: 202, revenue: "$27,100", cancellations: 14 },
  { month: "April", bookings: 190, revenue: "$25,830", cancellations: 10 },
  { month: "May", bookings: 238, revenue: "$32,480", cancellations: 16 },
  { month: "June", bookings: 312, revenue: "$53,550", cancellations: 18 },
] as const;
