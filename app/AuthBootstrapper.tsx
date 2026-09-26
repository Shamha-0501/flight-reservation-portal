"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/src/shared/redux/store";
import { authMe } from "@/src/shared/redux/store/authSlice";

export default function AuthBootstrapper() {
  const dispatch = useDispatch<AppDispatch>();
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    dispatch(authMe());
  }, [dispatch]);

  return null;
}

/**
 * Initializes the application's authentication state when the app loads.
 *
 * It dispatches `authMe()` once to check whether the user already has
 * a valid authenticated session and restores the current user into Redux.
 *
 * The `booted` ref prevents the authentication check from running
 * multiple times during the same component mount.
 */