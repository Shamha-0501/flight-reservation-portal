import { Controller } from "./Controller";
import { SessionManager } from "@/forge/core/auth/sessionManager";
import { User, type UserAttr } from "../models/User";
import { Role } from "../models/Role";
import { UserRole, UserRoleAttr } from "../models/UserRole";
import { UserProfile } from "../models/UserProfile";
import { ValidationException } from "@/forge/http/validation-exception";

export class AuthController extends Controller {
  private getIp(req: Request): string | null {
    const xf = req.headers.get("x-forwarded-for");
    if (xf) return xf.split(",")[0].trim() || null;
    return req.headers.get("x-real-ip") ?? null;
  }

  private getUserAgent(req: Request): string | null {
    return req.headers.get("user-agent") ?? null;
  }

  /**
   * Because your hydrate/new User(row) is currently dropping id,
   * we MUST use row.id as the source of truth.
   */
  private requireRowId(row: any, ctx: string): number {
    const userId = Number(row?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error(`${ctx}: userId is required (got: ${String(row?.id)})`);
    }
    return userId;
  }

  private makeUserModelFromRow(row: any) {
    if (!row) return null;

    // If your query returns a model already
    if (row instanceof User) return row;

    // Prefer your hydrate if it exists
    if (typeof (User as any).hydrate === "function") {
      return (User as any).hydrate(row) as InstanceType<typeof User>;
    }

    return new User(row) as any;
  }

  /**
   * POST /auth/register
   * Body: { email, password, password_confirmation, role_id? }
   */
  public async register(req: Request) {
    // 1) Validate + normalize using your validator
    try {
      const data = await req.validate(
        {
          fname: "sometimes|string|max:100",
          lname: "sometimes|string|max:100",

          email: "required|email",
          mobile: "sometimes|string|max:30",
          whatsapp: "sometimes|string|max:30",
          nic: "sometimes|string|max:50",

          password: "required|string|min:4",
          password_confirmation: "required|string",
        },
        {
          messages: {
            "email.required": "Email is required.",
            "email.email": "Email must be a valid email address.",

            "password.required": "Password is required.",
            "password.min": "Password must be at least 4 characters.",

            "password_confirmation.required":
              "Password confirmation is required.",
          },
        }
      );

      // 2) Normalize like you were doing
      const fname = String(data.fname ?? "")
        .trim()
        .toLowerCase();
      const lname = String(data.lname ?? "")
        .trim()
        .toLowerCase();
      const email = String(data.email ?? "")
        .trim()
        .toLowerCase();
      const mobile = String(data.mobile ?? "")
        .trim()
        .toLowerCase();
      const whatsapp = String(data.whatsapp ?? "")
        .trim()
        .toLowerCase();
      const nic = String(data.nic ?? "")
        .trim()
        .toLowerCase();

      const password = String(data.password ?? "");
      const password_confirmation = String(data.password_confirmation ?? "");

      // 3) Extra validation not covered by your generic validator (confirmation match)
      if (password !== password_confirmation) {
        return {
          status: 422,
          errors: { password_confirmation: "Passwords do not match." },
        };
      }

      // 4) Fetch role
      const role = await (Role as any)
        .query()
        .where("role_key = ?", ["provider"])
        .first();

      const role_id = role?.id ?? null;

      // Keep your role_id check
      if (role_id !== null && (Number.isNaN(role_id) || role_id <= 0)) {
        return {
          status: 422,
          errors: { role_id: "Role ID must be a positive number." },
        };
      }

      // 5) Unique email check
      const existing = await (User as any)
        .query()
        .where("email = ?", [email])
        .first();

      if (existing) {
        return { status: 422, errors: { email: "Email is already taken." } };
      }

      // 6) Create user
      const passwordHash = this.hashPassword(password);

      const newUser = new User({
        email,
        password: passwordHash,
      } as Partial<UserAttr>);

      await newUser.save();

      // Re-fetch row to guarantee we have id
      const row = await (User as any)
        .query()
        .where("email = ?", [email])
        .first();
      const userId = this.requireRowId(row, "Register");

      // Assign role
      const userRole = new UserRole({
        user_id: row.id,
        role_id: role_id,
      } as Partial<UserRoleAttr>);
      await userRole.save();

      // Create profile
      const userProfile = new UserProfile({
        user_id: row.id,
        fname,
        lname,
        mobile,
        whatsapp,
        nic,
      });
      await userProfile.save();

      // Session
      const ip = this.getIp(req);
      const userAgent = this.getUserAgent(req);

      const sessionId = await SessionManager.createSession({
        userId,
        ip,
        userAgent,
      });

      const userModel = this.makeUserModelFromRow(row);

      return {
        status: 201,
        data: {
          user: userModel?.toJSON ? userModel.toJSON() : row,
          session_id: sessionId,
        },
      };
    } catch (e: any) {
      // 7) Convert ValidationException -> {status:422, errors}
      if (e instanceof ValidationException) {
        // Your ValidationException stores arrays: Record<string, string[]>
        // If you want single string like your current controller, pick first message
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(e.errors || {})) {
          flat[k] = Array.isArray(msgs) ? msgs[0] ?? "Invalid." : String(msgs);
        }
        return { status: 422, errors: flat };
      }

      throw e; // keep real server errors visible
    }
  }

  /**
   * POST /auth/login
   * Body: { email, password }
   */
  public async login(req: Request) {
    try {
      const data = await req.validate({
        email: "required|email",
        password: "required|string",
      });

      const email = String(data.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(data.password ?? "");

      // Your logs confirm this is a plain DB row with row.id present
      const row = await (User as any)
        .query()
        .where("email = ?", [email])
        .first();

      if (!row) {
        return { status: 422, errors: { email: "Invalid credentials." } };
      }

      // Use row.id (do NOT rely on hydrate for id)
      const userId = this.requireRowId(row, "Login");

      // Password verification using the row
      const storedPassword = String(row.password ?? "");
      if (!storedPassword || !this.verifyPassword(password, storedPassword)) {
        return { status: 422, errors: { email: "Invalid credentials." } };
      }

      // ✅ Use patched request helpers
      const ip = req.ip?.() ?? this.getIp(req); // fallback to your old helper if needed
      const userAgent = req.header?.("user-agent") ?? this.getUserAgent(req);

      const sessionId = await SessionManager.createSession({
        userId,
        ip,
        userAgent,
      });

      const userModel = this.makeUserModelFromRow(row);

      return {
        status: 200,
        data: {
          user: userModel?.toJSON ? userModel.toJSON() : row,
          session_id: sessionId,
        },
      };
    } catch (e: any) {
      // ✅ ValidationException from your forge/http layer
      if (e?.status === 422 && e?.errors) {
        // normalize to your old shape (field -> string)
        const flat: Record<string, string> = {};
        for (const [k, arr] of Object.entries(
          e.errors as Record<string, string[]>
        )) {
          flat[k] = Array.isArray(arr) ? arr[0] ?? "Invalid." : String(arr);
        }
        return { status: 422, errors: flat };
      }

      // unexpected errors
      throw e;
    }
  }

  /**
   * GET /auth/me
   */
  public async me(_req: Request, user: User | null) {
    if (!user) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }
    const usr = await (User as any)
      .query()
      .where("email = ?", [user.email])
      .first();
    const pro = await (UserProfile as any)
      .query()
      .where("user_id = ?", [usr.id])
      .first();
    return {
      status: 200,
      data: {
        user: { fname: pro?.fname, lname: pro?.lname, email: usr.email },
      },
    };
  }

  /**
   * POST /auth/logout
   */
  public async logout(_req: Request, sessionId: string | null) {
    if (sessionId) {
      await SessionManager.destroySession(sessionId);
    }
    return { status: 200, data: { message: "Logged out." } };
  }
}
