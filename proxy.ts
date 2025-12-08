import { NextResponse, type NextRequest } from "next/server";
import { Backend } from "@/forge/core/http";

import { CorsMiddleware } from "@/forge/core/middlewares/cors";
import { CSRFIssuerMiddleware } from "@/forge/core/middlewares/csrfIssuer";
import { CSRFEnforceMiddleware } from "@/forge/core/middlewares/csrfEnforce";
import { AuthSanctumPopulate } from "@/forge/core/middlewares/authSanctumPopulate";
import { AuthRequiredMiddleware } from "@/forge/core/middlewares/authRequired";

const app = new Backend();

// Register aliases
app.alias("cors", CorsMiddleware);
app.alias("csrf.issue", CSRFIssuerMiddleware);
app.alias("csrf", CSRFEnforceMiddleware);
app.alias("auth.optional", AuthSanctumPopulate);
app.alias("auth", AuthRequiredMiddleware);

// Global middleware stack
app.useAliases(["cors", "csrf.issue", "csrf", "auth.optional", "auth"]);

// Later we can extend App to attach extra stacks based on path (groups).

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  return app.handle(req);
}

export const config = {
  matcher: ["/api/:path*"],
};
