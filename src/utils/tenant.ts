export type TenantKey = string;

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "")
  .toLowerCase()
  .trim();

const APP_PORT = (process.env.NEXT_PUBLIC_APP_PORT || "").trim();

const RESERVED = new Set(
  (process.env.NEXT_PUBLIC_RESERVED_SUBDOMAINS || "www,api")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

function getTenantKey(user: any): TenantKey | null {
  const key =
    user?.tenants?.[0]?.key ??
    user?.tenant_key ??
    user?.tenantKey ??
    user?.tenant?.key ??
    user?.tenant?.slug;

  return typeof key === "string" && key.trim().length ? key.trim() : null;
}

function getSubdomain(hostname: string) {
  if (!ROOT_DOMAIN) return null;
  const suffix = "." + ROOT_DOMAIN;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  return sub || null;
}

function portPart() {
  // hostname never includes port; host includes it.
  // If you're running dev on :3000, keep it.
  const p = APP_PORT || window.location.port;
  return p ? `:${p}` : "";
}

export function isBaseHost() {
  if (typeof window === "undefined") return false;
  if (!ROOT_DOMAIN) return false;

  return window.location.hostname.toLowerCase() === ROOT_DOMAIN;
}

export function redirectToTenantIfNeeded(user: any, path = "/") {
  if (typeof window === "undefined") return;
  if (!ROOT_DOMAIN) return;

  const tenantKey = getTenantKey(user);
  if (!tenantKey) return;

  const hostname = window.location.hostname.toLowerCase();
  const sub = getSubdomain(hostname);

  // If already on a subdomain (tenant or reserved), don't redirect.
  if (sub && sub.length) return;
  if (!isBaseHost()) return;

  // Prevent redirect to reserved subdomains
  if (RESERVED.has(tenantKey.toLowerCase())) return;

  const target = `${window.location.protocol}//${tenantKey}.${ROOT_DOMAIN}${portPart()}${path}`;

  if (window.location.href !== target) {
    // replace avoids back button going to base host and re-triggering
    window.location.replace(target);
  }
}

export function redirectToBase(path = "/") {
  if (typeof window === "undefined") return;
  if (!ROOT_DOMAIN) return;

  const target = `${window.location.protocol}//${ROOT_DOMAIN}${portPart()}${path}`;
  if (window.location.href !== target) window.location.replace(target);
}
