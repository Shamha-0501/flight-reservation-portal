const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS ?? "";
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsConfig = {
  paths: [
    "/api/*",
    "/login",
    "/logout",
    "/register",
    "/sanctum/csrf-cookie",
    "/user",
  ],

  allowedMethods: ["*"] as string[],
  allowedOrigins,
  allowedHeaders: ["*"] as string[],
  exposedHeaders: [] as string[],
  maxAge: 0,
  supportsCredentials: true,
};

export default corsConfig;
