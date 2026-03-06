"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/src/shared/redux/store/hooks";
import { fetchTenantBootstrap } from "@/src/shared/redux/store/tenantBootstrapSlice";
import { applyTenantTheme  } from "@/src/utils/runtimeConfig";
import { useBootstrapGate } from "@/src/app/BootstrapGate";

function getTenantKeyFromHostname(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length === 2 && parts[1] === "localhost") return parts[0];
  if (parts.length >= 3) return parts[0];
  return null;
}

export default function TenantBootstrapper({ tenantKey }: { tenantKey?: string }) {
  const { setTenantReady } = useBootstrapGate();
  const markedReady = useRef(false);

  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.tenantBootstrap.theme);
  const status = useAppSelector((s) => s.tenantBootstrap.status); // <-- add/ensure this exists

  const resolvedTenantKey = useMemo(() => {
    if (tenantKey && tenantKey.trim()) return tenantKey.trim();
    if (typeof window === "undefined") return "";
    return getTenantKeyFromHostname(window.location.hostname) ?? "";
  }, [tenantKey]);

  // If no tenant key, tenant bootstrap is "done"
  useEffect(() => {
    if (resolvedTenantKey) return;
    if (markedReady.current) return;
    markedReady.current = true;
    setTenantReady(true);
  }, [resolvedTenantKey, setTenantReady]);

  // Fetch bootstrap when we have tenantKey
  useEffect(() => {
    if (!resolvedTenantKey) return;
    dispatch(fetchTenantBootstrap(resolvedTenantKey));
  }, [resolvedTenantKey, dispatch]);

  // Mark tenant ready when request finishes (success OR failure)
  useEffect(() => {
    if (!resolvedTenantKey) return;
    if (status === "loading") return;
    if (markedReady.current) return;

    // status is idle/succeeded/failed => done
    markedReady.current = true;
    setTenantReady(true);
  }, [status, resolvedTenantKey, setTenantReady]);

  // Apply theme
  useEffect(() => {
    if (!theme?.tokens) return;

  const mode = theme.mode_default ?? "light";
  const tokensForMode = theme.tokens[mode] ?? theme.tokens.light;

  applyTenantTheme(tokensForMode);

  document.documentElement.setAttribute(
    "data-theme",
    mode === "dark" ? "dark" : "light"
  );

    if (theme.custom_css) {
      const id = "tenant-custom-css";
      let style = document.getElementById(id) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.head.appendChild(style);
      }
      style.textContent = theme.custom_css;
    }
  }, [theme]);

  return null;
}
