import Link from "next/link";

const exploreLinks = [
  { label: "Flights", href: "/#search" },
  { label: "Bookings", href: "/bookings" },
  { label: "Agencies", href: "/agencies" },
];

const supportLinks = [
  { label: "Help Center", href: "/help-center" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Contact Us", href: "/contact" },
];

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Security", href: "/security" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)] text-slate-700">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
              Flight Portal
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              Need help booking your next trip?
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-600">
              Search flights, manage bookings, and get support from one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/flights"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Explore flights
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Contact support
            </Link>
          </div>
        </div>

        <div className="grid gap-8 py-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-black text-white">
                FP
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Flight Portal</p>
                <p className="text-xs font-medium text-slate-500">Simple, secure booking</p>
              </div>
            </div>

            <p className="mt-2 max-w-sm text-sm leading-5 text-slate-600">
              A clean travel experience for passengers and agents, with booking
              history, route discovery, and support built in.
            </p>
          </div>

          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Support" links={supportLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="border-t border-slate-100 pt-3 text-center text-sm text-slate-500">
          <p>© 2026 Flight Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-950">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-slate-600 transition hover:text-blue-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
