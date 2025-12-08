import appConfig from "@/src/config/app";
import type { MiddlewareFunction } from "../http";
import sessionConfig from "@/src/config/session";
import apiConfig from "@/src/config/api";

const AUTH_COOKIE = sessionConfig.cookie; // e.g. "session_id" or "laravel_session"
const XSRF_COOKIE = "XSRF-TOKEN";

export const AuthSanctumPopulate: MiddlewareFunction = async (
  req,
  ctx,
  next
) => {
  const pathname = req.nextUrl.pathname;

  // 🔴 IMPORTANT: avoid recursion when we are already handling /api/auth/me
  if (pathname === "/api/auth/me") {
    return next();
  }

  // If already populated, don't re-fetch
  if (ctx.user) {
    return next();
  }

  const cookieHeader = req.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    ctx.sessionId = null;
    return next();
  }

  const cookies = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);

  // 🔹 Extract session cookie
  const sessionMatch = cookies.find((c) => c.startsWith(`${AUTH_COOKIE}=`));

  if (sessionMatch) {
    ctx.sessionId = sessionMatch.split("=").slice(1).join("=") || null;
  } else {
    ctx.sessionId = null;
  }

  if (!ctx.sessionId) {
    return next();
  }

  // 🔹 Extract XSRF token
  const xsrfMatch = cookies.find((c) => c.startsWith(`${XSRF_COOKIE}=`));

  let xsrfToken: string | null = null;
  if (xsrfMatch) {
    xsrfToken = decodeURIComponent(xsrfMatch.split("=").slice(1).join("="));
  } 

  try {
    const url = new URL(apiConfig.meEndpoint, apiConfig.baseUrl);

    // Build headers that actually forward cookie + xsrf
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }

    if (xsrfToken) {
      headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        cookie: cookieHeader, // includes session_id=...
        "X-XSRF-TOKEN": xsrfToken ?? "", // if present
      },
    });
    
    if (!res.ok) {
      return next();
    }

    const user = await res.json();

    ctx.user = {
      id: user.id,
      email: user.email,
      ...user,
    };
  } catch (err) {
    return next();
  }

  return next();
};
