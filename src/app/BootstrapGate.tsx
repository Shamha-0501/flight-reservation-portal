"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type BootstrapCtx = {
  setAuthReady: (v: boolean) => void;
  setTenantReady: (v: boolean) => void;
};

const Ctx = createContext<BootstrapCtx | null>(null);

export function useBootstrapGate() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBootstrapGate must be used within BootstrapGate");
  return ctx;
}

function FullscreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="text-sm opacity-70">Loading…</p>
      </div>
    </div>
  );
}

export function BootstrapGate({
  bootstrappers,
  children,
}: {
  bootstrappers: React.ReactNode; // always mounted
  children: React.ReactNode; // gated UI
}) {
  const [authReady, setAuthReady] = useState(false);
  const [tenantReady, setTenantReady] = useState(false);

  const value = useMemo(() => ({ setAuthReady, setTenantReady }), []);
  const ready = authReady && tenantReady;

  return (
    <Ctx.Provider value={value}>
      {bootstrappers}

      {!ready && <FullscreenLoader />}

      {/* Keep mounted if you want, or conditionally mount. */}
      <div style={{ visibility: ready ? "visible" : "hidden" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
