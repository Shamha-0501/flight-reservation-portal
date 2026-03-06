"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import { authMe } from "@/src/shared/redux/store/authSlice";
import { redirectToTenantIfNeeded, isBaseHost } from "@/src/utils/tenant";
import { useBootstrapGate } from "@/src/app/BootstrapGate";

export function AuthBootstrapper() {
  const { setAuthReady } = useBootstrapGate();

  const dispatch = useDispatch<AppDispatch>();
  const { user, authStatus, meChecked } = useSelector((s: RootState) => s.auth);

  const booted = useRef(false);
  const redirected = useRef(false);
  const markedReady = useRef(false);

  // 1) Run authMe once
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    dispatch(authMe());
  }, [dispatch]);

  // Mark auth ready when ME check completes (success or fail)
  useEffect(() => {
    if (!meChecked) return;
    if (markedReady.current) return;
    markedReady.current = true;
    setAuthReady(true);
  }, [meChecked, setAuthReady]);

  // 2) Redirect after ME check completes
  useEffect(() => {
    if (!meChecked) return;
    if (redirected.current) return;

    if (authStatus !== "authenticated" || !user) return;
    if (!isBaseHost()) return;

    redirected.current = true;
    redirectToTenantIfNeeded(user, "/");
  }, [meChecked, authStatus, user]);

  return null;
}
