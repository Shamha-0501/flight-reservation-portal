import { NextRequest, NextResponse } from "next/server";
import type { MiddlewareFunction } from "../http";
import corsConfig from "@/src/config/cors";

const pathMatches = (pathname: string, pattern: string): boolean => {
    if (pattern.endsWith("/*")) {
        const base = pattern.slice(0, -2);
        return pathname === base || pathname.startsWith("/");
    }
    return pathname === pattern;
}

export const CorsMiddleware: MiddlewareFunction = async (req, ctx, next) => {
    const { pathname } = req.nextUrl;

    const shouldHandle = corsConfig.paths.some((pattern) => 
        pathMatches(pathname, pattern)
    );

    if (!shouldHandle) {
        return next();
    }

    const origin = req.headers.get("origin") ?? "";
    const isAllowedOrigin = 
        corsConfig.allowedOrigins.length === 0 || 
        corsConfig.allowedOrigins.includes(origin);
    
    if (req.method === "OPTIONS") {
        const res = new NextResponse(null, { status: 204 });

        if (isAllowedOrigin) {
            res.headers.set("Access-Control-Allow-Origin", origin);
        }

        if (corsConfig.supportsCredentials) {
            res.headers.set("Access-Control-Allow-Credentials", "true");
        }

        const reqMethod = req.headers.get("Access-Control-Request-Method") ?? "*";
        const reqHeaders = req.headers.get("Access-Control-Request-Headers") ?? "*";

        res.headers.set(
            "Access-Control-Allow-Methods",
            corsConfig.allowedMethods.includes("*")
                ? reqMethod
                : corsConfig.allowedMethods.join(",")
        );

        res.headers.set(
            "Access-Control-Allow-Headers",
            corsConfig.allowedHeaders.includes("*")
                ? reqHeaders
                : corsConfig.allowedHeaders.join(",")
        );

        if (corsConfig.maxAge > 0) {
            res.headers.set("Access-Control-Max-Age", String(corsConfig.maxAge));
        }

        return res;
    }

    const res = await next();
    
    if (isAllowedOrigin) {
        res.headers.set("Access-Control-Allow-Origin", origin);
    }

    if (corsConfig.supportsCredentials) {
        res.headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (corsConfig.exposedHeaders.length > 0) {
        res.headers.set(
            "Access-Control-Expose-Headers",
            corsConfig.exposedHeaders.join(",")
        );
    }

    return res;
}

