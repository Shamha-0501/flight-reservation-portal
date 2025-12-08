import { describe, it, expect, vi } from "vitest";
import { Backend, type MiddlewareFunction } from "@/forge/core/http";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const makeRequest = (url: string): NextRequest =>
  ({
    nextUrl: new URL(url),
    headers: new Headers(),
  } as any);

describe("Backend kernel", () => {
  it("runs middlewares in order", async () => {
    const app = new Backend();
    const calls: string[] = [];

    const mw1: MiddlewareFunction = async (req, ctx, next) => {
      calls.push("mw1-before");
      const res = await next();
      calls.push("mw1-after");
      return res;
    };

    const mw2: MiddlewareFunction = async (req, ctx, next) => {
      calls.push("mw2-before");
      const res = await next();
      calls.push("mw2-after");
      return res;
    };

    app.use(mw1).use(mw2);

    const res = await app.handle(makeRequest("http://localhost/test"));

    expect(res).toBeInstanceOf(NextResponse);
    expect(calls).toEqual([
      "mw1-before",
      "mw2-before",
      "mw2-after",
      "mw1-after",
    ]);
  });

  it("supports aliases and useAliases()", async () => {
    const app = new Backend();
    const calls: string[] = [];

    const mwAlias: MiddlewareFunction = async (req, ctx, next) => {
      calls.push("alias");
      return next();
    };

    app.alias("testAlias", mwAlias);
    app.useAliases(["testAlias"]);

    const res = await app.handle(makeRequest("http://localhost/alias"));

    expect(res).toBeInstanceOf(NextResponse);
    expect(calls).toEqual(["alias"]);
  });
});
