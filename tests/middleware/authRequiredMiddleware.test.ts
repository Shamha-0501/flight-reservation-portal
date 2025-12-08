import { describe, it, expect, vi } from "vitest";
import { AuthRequiredMiddleware } from "@/forge/core/middlewares/authRequired";
import type { MiddlwareContext } from "@/forge/core/http";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const makeRequest = (url: string): NextRequest =>
  ({
    nextUrl: new URL(url),
    headers: new Headers(),
  } as any);

describe("AuthRequiredMiddleware", () => {
  it("returns 401 when ctx.user is missing for /api/auth/me", async () => {
    const req = makeRequest("http://localhost/api/auth/me");
    const ctx: MiddlwareContext = {};

    const next = vi.fn().mockResolvedValue(NextResponse.next());

    const res = await AuthRequiredMiddleware(req, ctx, next);

    // should NOT call next, it should block here
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    const body = await res.text();
    expect(body).toContain("Unauthenticated");
  });

  it("calls next when ctx.user exists for /api/auth/me", async () => {
    const req = makeRequest("http://localhost/api/auth/me");
    const ctx: MiddlwareContext = {
      user: { id: 1, email: "test@example.com" },
    };

    const next = vi.fn().mockResolvedValue(NextResponse.next());

    const res = await AuthRequiredMiddleware(req, ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200); // NextResponse.next() default
  });

  // (optional but nice): shows that non-/api/auth/me paths are just passed through
  it("passes through for other paths even without user", async () => {
    const req = makeRequest("http://localhost/api/other");
    const ctx: MiddlwareContext = {};

    const next = vi.fn().mockResolvedValue(NextResponse.next());

    const res = await AuthRequiredMiddleware(req, ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
