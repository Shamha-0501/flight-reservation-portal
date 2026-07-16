"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, LogOut, Menu, Plane, User, X } from "lucide-react";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import { useAppDispatch } from "@/src/shared/redux/store/hooks";
import { logout } from "@/src/shared/redux/store/authSlice";
import { adminNavItems } from "./adminRoutes";
import { AuthAlert } from "../auth/AuthScaffold";
import { RouteLoadingScreen } from "../common/RouteLoadingScreen";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    user,
    role,
    selectedTenant,
    roleLabel,
    isAdmin,
    isPlatformAdmin,
    isTenantOwner,
    isTenantWorkspaceRole,
    canManageTenantUsers,
    loading,
    isAuthenticated,
    access,
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const isInvitationRoute = pathname?.startsWith("/admin/users/invite");
  const workspaceLabel = isPlatformAdmin
    ? role === "system_developer"
      ? "System Console"
      : "Admin Workspace"
    : selectedTenant?.name ?? "Tenant Workspace";
  const visibleNavItems = useMemo(
    () =>
      adminNavItems.filter((item) => {
        if (item.requiresTenantOwner) {
          return isTenantOwner;
        }
        if (item.audience === "all") return true;
        if (item.audience === "platform") return isPlatformAdmin;
        if (item.audience === "tenant") {
          return isTenantWorkspaceRole && (!item.requiresTenantLeadership || canManageTenantUsers);
        }

        return false;
      }),
    [canManageTenantUsers, isPlatformAdmin, isTenantOwner, isTenantWorkspaceRole],
  );
  const activeRoute =
    visibleNavItems.find((item) => pathname?.startsWith(item.match)) ??
    visibleNavItems[0];

  useEffect(() => {
    if (isInvitationRoute) {
      return;
    }

    if (loading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin/dashboard")}`);
      return;
    }

    if (access.kind === "blocked") {
      return;
    }

    if (!isAdmin) {
      router.replace("/bookings");
      return;
    }

    if (!visibleNavItems.length) {
      return;
    }

    const isRouteAllowed = visibleNavItems.some((item) =>
      pathname?.startsWith(item.match),
    );
    if (!isRouteAllowed) {
      router.replace(visibleNavItems[0].href);
    }
  }, [
    access.kind,
    isAdmin,
    isAuthenticated,
    isInvitationRoute,
    loading,
    pathname,
    router,
    visibleNavItems,
  ]);

  useEffect(() => {
    if (!profileOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [profileOpen]);

  async function handleLogout() {
    setProfileOpen(false);
    await dispatch(logout());
    router.replace("/login");
  }

  if (isInvitationRoute) {
    return <>{children}</>;
  }

  if (loading || !isAuthenticated) {
    return (
      <RouteLoadingScreen
        title="Loading dashboard"
        description="Preparing the admin workspace and permissions."
        variant="compact"
      />
    );
  }

  if (access.kind === "blocked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Workspace pending approval
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This account cannot open the admin workspace until the tenant status is active.
          </p>
          <div className="mt-5">
            <AuthAlert tone={access.tone} message={access.message} />
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <RouteLoadingScreen
        title="Redirecting"
        description="This account is being routed to the correct workspace."
        variant="compact"
      />
    );
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {sidebarOpen ? (
        <button
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/admin/dashboard" className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-slate-950">
              Flight <span className="text-blue-600">Portal</span>
            </div>
            <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
              Admin Workspace
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.match);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active workspace
            </div>
            <div className="truncate text-sm font-semibold text-slate-950">
              {workspaceLabel}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-500">
              {roleLabel}
            </div>
          </div>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Open sidebar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-950">{workspaceLabel}</div>
              <div className="truncate text-xs font-medium text-slate-500">
                {activeRoute?.title ?? "Admin"} · {roleLabel}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <Bell className="h-4 w-4" />
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setProfileOpen((value) => !value)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {userInitial}
                  </span>
                  <span className="hidden max-w-40 truncate sm:block">
                    {user?.name ?? "Admin"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="truncate text-sm font-semibold text-slate-950">
                        {user?.name ?? "Admin"}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {user?.email ?? workspaceLabel}
                      </div>
                    </div>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Plane className="h-4 w-4" />
                      Bookings
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
