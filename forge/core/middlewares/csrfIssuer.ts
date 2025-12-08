import { NextRequest, NextResponse } from "next/server";
import type { MiddlewareFunction } from "../http";
import sessionConfig from "@/src/config/session";

const CSRF_COOKIE = "XSRF-TOKEN";

// Paths where we want CSRF token cookie available
const csrfPaths: string[] = ["/api/*", "/login", "/register", "/logout"];

function pathMatches(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(base + "/");
  }
  return pathname === pattern;
}

export const CSRFIssuerMiddleware: MiddlewareFunction = async (req, ctx, next) => {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  const shouldHandle = csrfPaths.some((p) => pathMatches(pathname, p));
  if (!shouldHandle) {
    return next();
  }

  const isReading = method === "GET" || method === "HEAD" || method === "OPTIONS";

  let csrfCookie = req.cookies.get(CSRF_COOKIE)?.value;
  const needsToken = !csrfCookie;

  const res = await next();

  if (needsToken && isReading) {
    csrfCookie = crypto.randomUUID().replace(/-/g, "");
    res.cookies.set(CSRF_COOKIE, csrfCookie, {
      path: sessionConfig.path,
      domain: sessionConfig.domain,
      httpOnly: false, // JS-readable like Laravel's XSRF-TOKEN
      secure: sessionConfig.secure,
      sameSite: sessionConfig.sameSite as any,
      maxAge: sessionConfig.lifetime * 60,
    });
  }

  return res;
};
