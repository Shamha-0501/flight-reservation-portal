"use client";

import Link from "next/link";
import ToggleTheme from "../../../../ui/ToggleTheme";
import Container from "../../../../ui/Container";
import { useDispatch, useSelector } from "react-redux";
import { User } from "lucide-react";
import DropDown from "../../../../ui/DropDown";
import { useRouter } from "next/navigation";
import { logoutUser } from "../../../../redux/slices/authSlice";
import type { RootState } from "@/src/app/shared/redux/store";
import { CurrencySelect } from "../../CurrencySelect";
import { Globe } from "lucide-react";

export default function BottomNavbar() {
  const { isAuthenticated, isInitialized } = useSelector(
    (state: any) => state.auth
  );
  const currency = useSelector(
    (state: RootState) => state.currency.selectedCode
  );
  const router = useRouter();
  const dispatch = useDispatch();

  return (
    <Container className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-80">
      <nav>
        <div className="max-w-screen flex items-center justify-between px-6 py-2">
          {/* Left side */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link
              href={"/"}
              className="text-black dark:text-white text-xl font-semibold flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-emerald-600 flex justify-center items-center rounded-full">
                <Globe color="#fff"/>
              </div>
              <p>
                Global<span className="text-emerald-600">Tours</span>
              </p>
            </Link>
            <div className="hidden md:flex items-center gap-6 font-medium text-md">
              <Link
                href={"/"}
                className="text-black dark:text-white dark:hover:text-blue-400 transition"
              >
                Tours
              </Link>
              <Link
                href={"/"}
                className="text-black dark:text-white hover:text-black dark:hover:text-blue-400 transition"
              >
                About Us
              </Link>
              <Link
                href={"/"}
                className="text-black dark:text-white hover:text-black dark:hover:text-blue-400 transition"
              >
                FAQ
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-6 text-sm font-medium">
            <ToggleTheme />
            <Link
              href={"/"}
              className="bg-emerald-600 text-white text-md font-semibold px-4 py-2 rounded-[30px] dark:bg-emerald-600 dark:text-gray-50 hover:scale-[1.1] transition duration-300"
            >
              Get a Quote
            </Link>
            <Link
              href={"/"}
              className="text-black dark:text-white hover:text-black dark:hover:text-blue-400 transition hidden md:block"
            >
              Contact Us
            </Link>
        
            {/* Currency Select */}
            <CurrencySelect />

            {/* Auth section */}
            {!isInitialized ? (
              // Skeleton while auth/me is running
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : isAuthenticated ? (
              <DropDown
                placeholder={<User className="h-4 w-4 text-gray-700 dark:text-gray-200" />}
                items={[
                  {
                    label: "My Profile",
                    type: "normal",
                    onClick: () => router.push("/profile"),
                  },
                  {
                    label: "Logout",
                    type: "critical",
                    onClick: () => {
                      dispatch(logoutUser() as any);
                      router.push("/"); // optional redirect
                    },
                  },
                ]}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-black dark:text-white hover:text-black dark:hover:text-blue-400 transition hidden md:block"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-black dark:text-white hover:text-black dark:hover:text-blue-400 transition hidden md:block"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </Container>
  );
}
