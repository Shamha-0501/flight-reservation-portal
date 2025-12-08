import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { DB } from "@/forge/database/facades/db";
import { SessionManager } from "@/forge/core/auth/sessionManager";
import { User } from "@/src/http/models/User";
import { Session } from "@/src/http/models/Session";

describe("SessionManager (DB integration)", () => {
  let user: any;
  let sessionTable: string;

  beforeAll(async () => {
    sessionTable =
      (Session as any).getTable?.() ??
      (Session as any).table ??
      "sessions";

    await DB.query(`TRUNCATE TABLE \`${sessionTable}\``);

    user = new User({
      email: "session-test@example.com",
    });

    await user.save();
  });

  beforeEach(async () => {
    await DB.query(`TRUNCATE TABLE \`${sessionTable}\``);
  });

  it("creates a session row in DB and returns session id", async () => {
    const sessionId = await SessionManager.createSession({
      userId: user.id,
      ip: "127.0.0.1",
      userAgent: "vitest-agent",
      extra: { foo: "bar" },
    });

    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);

    const rows = await DB.table<any>(sessionTable)
      .where("`id` = ?", [sessionId])
      .get();

    expect(rows.length).toBe(1);

    const row = rows[0];

    expect(row.user_id).toBe(user.id);
    expect(row.ip_address).toBe("127.0.0.1");
    expect(row.user_agent).toBe("vitest-agent");

    const payload = JSON.parse(row.payload);
    expect(payload.foo).toBe("bar");
    expect(payload.login_at).toBeDefined();
  });

  it("getUserFromSession returns the attached user", async () => {
    const sessionId = await SessionManager.createSession({
      userId: user.id,
      ip: "10.0.0.1",
      userAgent: "agent-2",
    });

    const userFromSession =
      await SessionManager.getUserFromSession(sessionId);

    expect(userFromSession).not.toBeNull();
    expect(userFromSession!.id).toBe(user.id);
  });

  it("destroySession deletes the session row", async () => {
    const sessionId = await SessionManager.createSession({
      userId: user.id,
      ip: "203.0.113.5",
      userAgent: "destroy-agent",
    });

    const before = await DB.table<any>(sessionTable)
      .where("`id` = ?", [sessionId])
      .get();

    expect(before.length).toBe(1);

    await SessionManager.destroySession(sessionId);

    const after = await DB.table<any>(sessionTable)
      .where("`id` = ?", [sessionId])
      .get();

    expect(after.length).toBe(0);
  });
});
