import "server-only";

import { Storage } from "@/src/storage/lib";
import type { StorageDisk } from "@/forge/filesystem/types";
import { SessionManager } from "@/forge/core/auth/sessionManager";
import { cookies } from "next/headers";
import { User } from "@/src/http/models/User";

import crypto from "node:crypto";

export abstract class Controller {
  /**
   * Resolve authenticated user from session cookie.
   * Returns null if unauthenticated.
   */
  protected async getAuthUser(): Promise<User | null> {
    // hange cookie name if yours differs
    const sessionId = (await cookies()).get("session_id")?.value ?? null;

    if (!sessionId) return null;

    const user = await SessionManager.getUserFromSession(sessionId);

    return user ?? null;
  }

  /**
   * Same as getAuthUser, but throws if unauthenticated
   * (useful for protected endpoints)
   */
  protected async requireAuthUser(): Promise<User> {
    const user = await this.getAuthUser();
    if (!user) {
      throw new Error("Unauthenticated");
    }
    return user;
  }

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

  /** Available in every controller */
  protected storage = Storage;

  /** Like Laravel: Storage::disk() */
  protected disk(name?: string): StorageDisk {
    return this.storage.disk(name);
  }

  /** Optional shortcuts (nice to have) */
  protected publicDisk() {
    return this.disk("public");
  }

  protected privateDisk() {
    return this.disk("private");
  }

  protected s3Disk() {
    return this.disk("s3");
  }

  protected cloudinaryDisk() {
    return this.disk("cloudinary");
  }
}
