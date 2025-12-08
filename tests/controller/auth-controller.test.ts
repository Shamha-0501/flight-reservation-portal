import { describe, it, expect, beforeEach } from "vitest";
import { raw } from "@/forge/pool/mysql";
import { AuthController } from "@/src/http/controllers/AuthController";
import { SessionManager } from "@/forge/core/auth/sessionManager";

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return new Request("http://localhost:300/api", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function resetTables() {
  await raw.query("TRUNCATE TABLE users");
  await raw.query("TRUNCATE TABLE sessions");
}

beforeEach(async () => {
  await resetTables();
});

describe("AuthController (Forge Real DB)", () => {
  const controller = new AuthController();

  it("registers a new user and creates session", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "password123",
      password_confirmation: "password123",
      role_id: 1, // or whatever default role you want to test
    });

    const result = await controller.register(req as any);

    expect(result.status).toBe(201);
    expect(result.data).toBeTruthy();
    expect(result.data?.session_id).toBeDefined();

    const users = await raw.query("SELECT * FROM users");
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("test@example.com");

    // If you're saving role_id
    // expect(users[0].role_id).toBe(1);

    const sessions = await raw.query("SELECT * FROM sessions");
    expect(sessions.length).toBe(1);
    expect(sessions[0].user_id).toBe(users[0].id);
  });

  it("logs in user and creates session", async () => {
    await raw.query(
      "INSERT INTO users (first_name, last_name, role_id, email, password) VALUES (?, ?, ?, ?, ?)",
      [
        "Test",
        "User",
        1,
        "test@example.com",
        controller.hashPassword("password123"),
      ]
    );

    const req = makeRequest({
      email: "test@example.com",
      password: "password123",
    });

    const res = await controller.login(req as any);

    expect(res.status).toBe(200);
    expect(res.data?.user.email).toBe("test@example.com");
    expect(res.data?.session_id).toBeDefined();
  });

  it("returns user in /me when user is passed", async () => {
    const fakeUser: any = {
      toJSON() {
        return {
          id: 1,
          first_name: "Demo",
          last_name: "User",
          email: "demo@test.com",
        };
      },
    };

    const res = await controller.me({} as any, fakeUser);

    expect(res.status).toBe(200);
    expect(res.data?.user?.email).toBe("demo@test.com");
  });

  it("returns null user in /me when not logged in", async () => {
    const res = await controller.me({} as any, null);

    expect(res.status).toBe(401);
    expect(res.data.user).toBeUndefined();
  });

  it("logs out and destroys session", async () => {
    const sessionId = await SessionManager.createSession({
      userId: 1,
      ip: "127.0.0.1",
      userAgent: "vitest",
    });

    const res = await controller.logout({} as any, sessionId);

    expect(res.status).toBe(200);

    const rows = await raw.query("SELECT * FROM sessions WHERE id = ?", [
      sessionId,
    ]);

    expect(rows.length).toBe(0);
  });
});
