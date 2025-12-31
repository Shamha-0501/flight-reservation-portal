import path from "node:path";
import crypto from "node:crypto";

export const safeJoin = (root: string, key: string) => {
  const cleaned = key.replace(/^\/+/, "");
  const full = path.resolve(root, cleaned);
  const rootResolved = path.resolve(root);
  if (!full.startsWith(rootResolved + path.sep) && full !== rootResolved) {
    throw new Error(`Invalid key path: ${key}`);
  }

  return full;
};

export const hmacSign = (payload: string, secret: string) => {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

export const timingSafeEqualHex = (a: string, b: string) => {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

export const normalizeKey = (key: string) => {
  return key.replace(/^\/+/, "").replace(/\\/g, "/");
};
