const sessionConfig = {
  driver: process.env.SESSION_DRIVER ?? "cookie",
  lifetime: Number(process.env.SESSION_LIFETIME ?? "120"),

  cookie: "session_id",

  path: process.env.SESSION_PATH ?? "/",
  domain: process.env.SESSION_DOMAIN || undefined,

  secure: process.env.SESSION_SECURE_COOKIE === "true",
  httpOnly: process.env.SESSION_HTTP_ONLY !== "false", // default true
  sameSite:
    (process.env.SESSION_SAME_SITE as "lax" | "strict" | "none" | undefined) ??
    "lax",
};

export default sessionConfig;