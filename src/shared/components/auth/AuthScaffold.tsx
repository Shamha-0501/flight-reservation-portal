"use client";

import Link from "next/link";
import PreviewDropdown, {
  type PreviewDropdownOption,
} from "@/src/shared/ui/PreviewDropdown";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  aside?: ReactNode;
  centered?: boolean;
  centeredMaxWidthClass?: string;
  centeredOuterMaxWidthClass?: string;
  contentClassName?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  aside,
  centered = false,
  centeredMaxWidthClass = "max-w-xl",
  centeredOuterMaxWidthClass = "max-w-3xl",
  contentClassName,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_32%),linear-gradient(180deg,#eef7ff_0%,#f8fbff_36%,#ffffff_100%)]">
      <div
        className={`mx-auto min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${
          centered ? `flex w-full items-center justify-center ${centeredOuterMaxWidthClass}` : "grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(480px,0.85fr)]"
        }`}
      >
        {!centered ? (
          <section className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700 backdrop-blur">
              Flight Reservation Portal
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {subtitle}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard title="Unified Access" text="One login for travelers, agencies, staff, and platform operators." />
              <FeatureCard title="Approval Aware" text="Agency workspaces stay blocked until an admin activates them." />
              <FeatureCard title="Booking Ready" text="Stay aligned with the flight booking experience already in the portal." />
            </div>
            {aside ? <div className="mt-8">{aside}</div> : null}
          </section>
        ) : null}

        <section className={`flex items-center ${centered ? "w-full justify-center" : ""}`}>
          <div
            className={
              centered && contentClassName
                ? contentClassName
                : `rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 ${centered ? `w-full ${centeredMaxWidthClass}` : "w-full"}`
            }
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

export const AuthScaffold = AuthShell;

export function AuthCardTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-700">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function AuthAlert({
  tone,
  message,
}: {
  tone: "error" | "success" | "info";
  message: string;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${className}`}>
      {message}
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  error,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {optional ? <span className="ml-1 text-slate-400">optional</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-50 ${props.className ?? ""}`.trim()}
    />
  );
}

export function AuthTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-50 ${props.className ?? ""}`.trim()}
    />
  );
}

export function AuthSelect({
  options,
  placeholder,
  value,
  onChange,
  className,
}: {
  options: PreviewDropdownOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <PreviewDropdown
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={onChange}
      className={`h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 focus:border-sky-300 focus:ring-4 focus:ring-sky-50 ${className ?? ""}`.trim()}
      menuClassName="rounded-xl"
    />
  );
}

export function AuthSubmit({
  label,
  loadingLabel,
  loading,
}: {
  label: string;
  loadingLabel: string;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

export function AuthLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1 text-sm">
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className="font-semibold text-sky-700 transition hover:text-sky-900"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
