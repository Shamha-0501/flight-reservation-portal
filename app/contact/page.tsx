import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f8fafc_100%)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
              Flight Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Reach support for booking help, cancellation questions, refund
              checks, or account issues.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] sm:px-8">
            <section className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Send a message
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" placeholder="Your name" />
                <Field label="Email" placeholder="you@example.com" type="email" />
              </div>
              <Field label="Subject" placeholder="What do you need help with?" />
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  rows={6}
                  placeholder="Tell us about the booking, issue, or request."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Submit request
              </button>
            </section>

            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Support details
              </h2>
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Use this page for general support and booking questions. For
                  faster resolution, include your booking reference and account email.
                </p>
                <p>
                  If your issue is about cancellation, refund, or booking status,
                  mention the relevant section so the team can route it correctly.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  Quick links
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link href="/help-center" className="text-slate-700 hover:text-blue-700">
                    Help Center
                  </Link>
                  <Link href="/cancellation-policy" className="text-slate-700 hover:text-blue-700">
                    Cancellation Policy
                  </Link>
                  <Link href="/refund-policy" className="text-slate-700 hover:text-blue-700">
                    Refund Policy
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}
