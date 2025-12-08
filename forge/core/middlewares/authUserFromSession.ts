import { SessionManager } from "@/forge/core/auth/sessionManager";

const SESSION_COOKIE =
  process.env.SESSION_COOKIE ?? "nf_session";

export async function attachUserFromSession(
  req: any,
  res: any,
  next: () => Promise<void> | void
) {
  const sessionId = req.cookies?.get(SESSION_COOKIE);

  if (!sessionId) {
    req.user = null;
    return next();
  }

  const user = await SessionManager.getUserFromSession(sessionId);

  req.user = user;
  return next();
}