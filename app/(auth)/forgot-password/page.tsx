import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
            Password recovery
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
            Forgot your password?
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The login page now routes here instead of returning a missing page. When the backend
            reset flow is ready, this page can be replaced with the full recovery form.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700"
            >
              Back to Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Create Customer Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
