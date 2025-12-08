export interface Request {
  headers: Record<string, string | undefined>;
  cookies: Map<string, string>;  // however you parse cookies
  ip?: string;
  userAgent?: string;
  user?: any;                    // will be filled
}