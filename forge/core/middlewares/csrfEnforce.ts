import { NextRequest, NextResponse } from "next/server";
import type { MiddlewareFunction } from "../http";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";

// Where CSRF must be validated
const protectedPaths: string[] = ["/api/*"];
// Routes that are public within protected
const exceptPaths: string[] = ["/api/public/*"];

const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

function pathMatches(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(base + "/");
  }
  return pathname === pattern;
}

function isProtected(pathname: string): boolean {
  const inProtected = protectedPaths.some((p) => pathMatches(pathname, p));
  const inExcept = exceptPaths.some((p) => pathMatches(pathname, p));
  return inProtected && !inExcept;
}

export const CSRFEnforceMiddleware: MiddlewareFunction = async (req, ctx, next) => {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  const res = await next();

  if (!protectedMethods.includes(method)) return res;
  if (!isProtected(pathname)) return res;

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value ?? "";
  const headerToken = req.headers.get(CSRF_HEADER) ?? "";

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return new NextResponse(
      JSON.stringify({ message: "CSRF token mismatch." }),
      {
        status: 419,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return res;
};
