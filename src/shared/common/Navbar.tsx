"use client";

import { useEffect, useRef, useState } from "react";
import { ToggleTheme } from "../ui/ToggleTheme";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Plane, User, X } from "lucide-react";
import Container from "../ui/Container";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/store/authSlice";
import type { AppDispatch, RootState } from "../redux/store";
import { getPostLoginAccess } from "../auth/authModel";

export const Navbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus, user } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = authStatus === "authenticated";
  const access = getPostLoginAccess(user);
  const showDashboardLink = access.kind === "platform" || access.kind === "tenant";
  const userInitial = (user?.name?.trim()?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const el = userMenuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setUserMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setOpen(false);
    await dispatch(logout());
    router.replace("/login");
  };

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="w-full border-b border-border bg-bg text-fg">
      <Container size="container">
        <div className="mx-auto flex h-14 items-center justify-between max-sm:px-4 sm:h-16">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-sm font-semibold sm:text-base">
              Flight <span className="text-primary">Portal</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex sm:gap-3">
            <Link
              href="/agency/register"
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
            >
              For Agents
            </Link>

            <ToggleTheme />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                </button>

                <div className="relative z-50" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {userInitial}
                    </span>
                    <span className="hidden max-w-40 truncate sm:block">
                      {user?.name ?? "Account"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="truncate text-sm font-semibold text-slate-950">
                        {user?.name ?? "Account"}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {user?.email ?? ""}
                      </div>
                    </div>
                    {showDashboardLink ? (
                      <Link
                        href="/admin/dashboard"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    ) : null}
                    <Link
                      href="/bookings"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Plane className="h-4 w-4" />
                      Bookings
                    </Link>

                    <Link
                      href="/profile"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md border border-primary px-3 py-2 text-center text-sm font-semibold text-primary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open ? "true" : "false"}
            aria-controls="mobile-menu"
            className="inline-flex h-10 w-10 items-center justify-center bg-bg text-fg sm:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="fixed inset-0 z-[999] sm:hidden">
            <button
              aria-label="Close menu backdrop"
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-full bg-bg text-fg">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center bg-bg text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex h-[calc(100%-3.5rem)] flex-col gap-1 px-4 py-4">
                <Link
                  href="/home"
                  className="w-full rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  Flight Portal
                </Link>
                <Link
                  href="/agency/register"
                  className="w-full rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  For Agents
                </Link>

                <div className="my-3 h-px bg-border" />

                <div className="rounded-lg px-1 py-1">
                  <ToggleTheme />
                </div>

                {isAuthenticated ? (
                  <div className="mt-4 grid gap-2">
                    {showDashboardLink ? (
                      <Link
                        href="/admin/dashboard"
                        className="w-full rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : null}
                    <Link
                      href="/bookings"
                      className="w-full rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      Bookings
                    </Link>
                    <Link
                      href="/profile"
                      className="w-full rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-muted"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto grid gap-2 pt-4">
                    <Link
                      href="/login"
                      className="w-full rounded-lg border border-primary px-3 py-3 text-center text-sm font-semibold text-primary hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="w-full rounded-lg bg-primary px-3 py-3 text-center text-sm font-semibold text-white"
                      onClick={() => setOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
