// src/forge/security/password.ts
import crypto from "crypto";

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = "sha512";

/**
 * Hash a plain password.
 * Returns a string in the format: "salt$hash"
 */
export function hashPassword(plain: string, salt?: string): string {
  const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(plain, usedSalt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");

  return `${usedSalt}$${hash}`;
}

/**
 * Verify a plain password against the stored "salt$hash".
 */
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, storedHash] = stored.split("$");
  if (!salt || !storedHash) return false;

  const hash = crypto
    .pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}
