"use client";

import { useEffect, useRef, useState } from "react";
import { ToggleTheme } from "../ui/ToggleTheme";
import { Menu, X } from "lucide-react";
import { FaCircleUser } from "react-icons/fa6";
import Container from "../ui/Container";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/store/authSlice";

export const Navbar = () => {
  const dispatch = useDispatch();
  
  const status = useSelector((state: any) => state.auth.authStatus);
  const [open, setOpen] = useState(false); // mobile menu
  const [userMenuOpen, setUserMenuOpen] = useState(false); // user dropdown

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = status === "authenticated";

  // Close menus on ESC
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

  // Close user dropdown on outside click
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

  // Lock scroll when mobile menu is open
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
    dispatch(logout() as any);
  };

  return (
    <header className="w-full border-b border-border bg-bg text-fg">
      <Container size="container">
        <div className="mx-auto flex h-14 items-center justify-between max-sm:px-4 sm:h-16">
          {/* Brand */}
          <div className="flex items-center gap-2">
            {/* <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-lg font-bold text-white">
              FP
            </div> */}
            <span className="text-sm font-semibold sm:text-base">
              Flight <span className="text-primary">Portal</span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 sm:flex sm:gap-3">
            {/* <a className="text-sm hover:underline" href="#">
              Docs
            </a>
            <a className="text-sm hover:underline" href="#">
              Pricing
            </a> */}

            <ToggleTheme />

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="inline-flex items-center justify-center rounded-md"
                >
                  <FaCircleUser size={32} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-bg shadow-lg"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block px-4 py-3 text-sm hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>

                    <div className="h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href={"/SignIn"}
                  className="rounded-md px-3 py-2 text-sm text-center font-semibold text-primary border border-primary"
                >
                  Login
                </Link>
                <Link
                  href={"/SignUp"}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-center font-semibold text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
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

        {/* Mobile full-screen overlay */}
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
                {/* <a
                  className="w-full rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  href="#"
                  onClick={() => setOpen(false)}
                >
                  Docs
                </a>
                <a
                  className="w-full rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  href="#"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </a> */}

                <div className="my-3 h-px bg-border" />

                <div className="rounded-lg px-1 py-1">
                  <ToggleTheme />
                </div>

                <div className="mt-auto grid gap-2 pt-4">
                  <Link
                    href={"/SignIn"}
                    className="w-full rounded-lg px-3 py-3 border border-primary text-sm text-center font-semibold text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href={"/SignUp"}
                    className="w-full rounded-lg bg-primary px-3 py-3 text-sm text-center font-semibold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
