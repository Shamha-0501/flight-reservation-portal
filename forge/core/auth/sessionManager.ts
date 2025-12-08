import crypto from "crypto";
import { Session, SessionAttrs } from "@/src/http/models/Session";
import { User } from "@/src/http/models/User";
import { DB } from "@/forge/database/facades/db";

export class SessionManager {
  // 120 minutes default
  private static SESSION_LIFETIME_MINUTES = Number(
    process.env.SESSION_LIFETIME ?? "120"
  );

  static async createSession(params: {
    userId: number;
    ip?: string | null;
    userAgent?: string | null;
    extra?: Record<string, any>;
  }): Promise<string> {
    const { userId, ip = null, userAgent = null, extra = {} } = params;

    const sessionId = crypto.randomUUID().replace(/-/g, "");
    const now = new Date();

    const payload = JSON.stringify({
      ...extra,
      login_at: now.toISOString(),
    });

    const session = new Session({
      id: sessionId,
      user_id: userId,
      payload,
      ip_address: ip,
      user_agent: userAgent,
      last_activity: now,
    });

    await session.save();

    return sessionId;
  }

  static async getUserFromSession(sessionId: string): Promise<User | null> {
    const sessionRow = await (DB as any)
      .table("sessions")
      .where("`id` = ?", [sessionId])
      .first();

    if (!sessionRow) return null;

    const last = new Date(sessionRow.last_activity);
    const now = new Date();
    const diffMinutes =
      (now.getTime() - last.getTime()) / (1000 * 60);

    if (diffMinutes > this.SESSION_LIFETIME_MINUTES) {
      // expired → hard delete this session
      await (DB as any)
        .table("sessions")
        .where("`id` = ?", [sessionId])
        .delete()
        .exec?.(); // if your QueryBuilder needs exec()

      return null;
    }

    if (!sessionRow.user_id) return null;

    // touch last_activity
    await (DB as any)
      .table("sessions")
      .where("`id` = ?", [sessionId])
      .update({ last_activity: now })
      .exec?.();

    const user = await (User as any).find(sessionRow.user_id);
    return user ?? null;
  }

  static async destroySession(sessionId: string): Promise<void> {
    await (DB as any)
      .table("sessions")
      .where("`id` = ?", [sessionId])
      .delete()
      .exec?.();
  }
}
