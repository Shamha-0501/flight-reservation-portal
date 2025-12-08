import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthSanctumPopulate } from "@/forge/core/middlewares/authSanctumPopulate";
import sessionConfig from "@/src/config/session";
import apiConfig from "@/src/config/api";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { MiddlwareContext } from "@/forge/core/http";

const makeRequest = (url: string, cookieHeader?: string): NextRequest =>
  ({
    nextUrl: new URL(url),
    headers: new Headers(cookieHeader ? { cookie: cookieHeader } : {}),
    cookies: {
      get(name: string) {
        if (!cookieHeader) return undefined;
        const part = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${name}=`));
        if (!part) return undefined;
        const value = part.split("=").slice(1).join("=");
        return { value };
      },
    },
  } as any);

const runMiddleware = async (req: NextRequest, ctx: MiddlwareContext = {}) => {
  const next = vi.fn().mockResolvedValue(NextResponse.next());
  const res = await AuthSanctumPopulate(req, ctx, next);
  return { res, ctx, next };
};

describe("AuthSanctumPopulate middleware", () => {
  const SESSION_COOKIE = sessionConfig.cookie;

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("does nothing when there is no cookie header", async () => {
    globalThis.fetch = vi.fn() as any;

    const req = makeRequest("http://localhost/test");
    const ctx: MiddlwareContext = {};

    const { ctx: finalCtx, next } = await runMiddleware(req, ctx);

    expect(next).toHaveBeenCalledTimes(1);
    expect(finalCtx.user).toBeUndefined();
    expect(finalCtx.sessionId).toBeNull(); // <-- changed
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("sets sessionId but treats user as guest when /auth/me responds non-OK", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("Unauthorized", { status: 401 })) as any;

    const cookieHeader = `${SESSION_COOKIE}=abc123; other=foo=bar`;
    const req = makeRequest("http://localhost/protected", cookieHeader);
    const ctx: MiddlwareContext = {};

    const { ctx: finalCtx, next } = await runMiddleware(req, ctx);

    expect(next).toHaveBeenCalledTimes(1);
    expect(finalCtx.sessionId).toBe("abc123");
    expect(finalCtx.user).toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(String(calledUrl)).toBe(
      // <-- changed
      new URL(apiConfig.meEndpoint, apiConfig.baseUrl).toString()
    );
  });

  it("populates ctx.user when backend returns valid user", async () => {
    const userPayload = { id: 42, email: "test@example.com", role: "admin" };

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(userPayload), { status: 200 })
      ) as any;

    const cookieHeader = `${SESSION_COOKIE}=sessionXYZ; another=abc`;
    const req = makeRequest("http://localhost/dashboard", cookieHeader);
    const ctx: MiddlwareContext = {};

    const { ctx: finalCtx, next } = await runMiddleware(req, ctx);

    expect(next).toHaveBeenCalledTimes(1);
    expect(finalCtx.sessionId).toBe("sessionXYZ");
    expect(finalCtx.user).toEqual(
      expect.objectContaining({
        id: 42,
        email: "test@example.com",
        role: "admin",
      })
    );

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as any).mock.calls[0];
    expect(String(url)).toBe(
      // <-- changed
      new URL(apiConfig.meEndpoint, apiConfig.baseUrl).toString()
    );
    expect(options.headers.cookie).toBe(cookieHeader);
  });
});
