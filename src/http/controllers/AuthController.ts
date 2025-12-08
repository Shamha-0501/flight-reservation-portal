import { Controller } from "./Controller";
import { SessionManager } from "@/forge/core/auth/sessionManager";
import { User, UserAttrs } from "../models/User";

export class AuthController extends Controller {
  /**
   * POST /auth/register
   * Body: { email, password, password_confirmation, role_id? }
   */
  public async register(req: Request) {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const password_confirmation = String(body.password_confirmation ?? "");
    const role_id_raw = body.role_id ?? null;
    const role_id =
      role_id_raw !== null && role_id_raw !== undefined
        ? Number(role_id_raw)
        : null;

    const errors: Record<string, string> = {};

    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (password && password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (password !== password_confirmation) {
      errors.password_confirmation = "Passwords do not match.";
    }

    // Optional: basic validation for role_id if provided
    if (role_id !== null && (Number.isNaN(role_id) || role_id <= 0)) {
      errors.role_id = "Role ID must be a positive number.";
    }

    if (email) {
      const existing = await (User as any)
        .query()
        .where("`email` = ?", [email])
        .first();

      if (existing) {
        errors.email = "Email is already taken.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        status: 422,
        errors,
      };
    }

    const passwordHash = this.hashPassword(password);

    const user = new User({
      email,
      password: passwordHash,
      // role_id is optional; if you want a default, you can set it here
      role_id,
    } as Partial<UserAttrs>);

    await user.save();

    // you'll usually grab IP/UA from headers
    const ip =
      (req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        null);
    const userAgent = req.headers.get("user-agent") ?? null;

    const sessionId = await SessionManager.createSession({
      userId: (user as any).id,
      ip,
      userAgent,
    });

    return {
      status: 201,
      data: {
        user: user.toJSON(),
        session_id: sessionId,
      },
    };
  }

  /**
   * POST /auth/login
   * Body: { email, password }
   */
  public async login(req: Request) {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      return {
        status: 422,
        errors,
      };
    }

    const row = await (User as any)
      .query()
      .where("`email` = ?", [email])
      .first();

    if (!row) {
      return {
        status: 422,
        errors: { email: "Invalid credentials." },
      };
    }

    const user = (User as any).hydrate(row) as InstanceType<typeof User>;
    const storedPassword = (user as any).password as string | undefined;

    if (!storedPassword || !this.verifyPassword(password, storedPassword)) {
      return {
        status: 422,
        errors: { email: "Invalid credentials." },
      };
    }

    const ip =
      (req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        null);
    const userAgent = req.headers.get("user-agent") ?? null;

    const sessionId = await SessionManager.createSession({
      userId: (user as any).id,
      ip,
      userAgent,
    });

    return {
      status: 200,
      data: {
        user: user.toJSON(),
        session_id: sessionId,
      },
    };
  }

  /**
   * GET /auth/me
   *
   * user is injected from middleware / backend router
   */
  public async me(_req: Request, user: User | null) {
    if (!user) {
      return {
        status: 401,
        data: { message: "Unauthenticated" },
      };
    }

    return {
      status: 200,
      data: { user: user.toJSON() },
    };
  }

  /**
   * POST /auth/logout
   */
  public async logout(_req: Request, sessionId: string | null) {
    if (sessionId) {
      await SessionManager.destroySession(sessionId);
    }

    return {
      status: 200,
      data: { message: "Logged out." },
    };
  }
}
