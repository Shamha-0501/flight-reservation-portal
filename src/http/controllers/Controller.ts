import crypto from "crypto";

export class Controller {
  // ---- password helpers ----

  public hashPassword(password: string, salt?: string): string {
    const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, usedSalt, 100_000, 64, "sha512")
      .toString("hex");

    // store as "salt$hash"
    return `${usedSalt}$${hash}`;
  }

  public verifyPassword(password: string, stored: string): boolean {
    const [salt, storedHash] = stored.split("$");
    if (!salt || !storedHash) return false;

    const hash = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  }
}
