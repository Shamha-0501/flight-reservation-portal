import { User } from "../models/User";
import { Controller } from "./Controller";

export class UserController extends Controller {
  public async debugPermissions(req: Request) {
    const authUser = await this.getAuthUser();
    if (!authUser) throw new Error("Unauthenticated");

    const user = (await (User as any).find(authUser.id)) as User;

    const subjects = await user.getSubjects();
    const policies = await user.getPolicies();
    const perms = await user.resolvePermissions();
    const canViewProfile = await user.can("user", "view");

    console.log({ subjects, policies, perms, canViewProfile });

    return { subjects, perms, canViewProfile };
  }

  public async uploadAvatar(fileBuffer: Buffer, fileName: string) {
    // default disk from FILESYSTEM_DISK
    const res = await this.disk().put(
      fileBuffer,
      `users/avatars/${Date.now()}_${fileName}`,
      { contentType: "image/jpeg" }
    );

    return res;
  }

  public async privateDocLink(key: string) {
    // local private disk -> signed URL -> served by /files/private route
    const url = await this.privateDisk().signedUrl(key, {
      expiresInSeconds: 60 * 10,
      downloadName: "document.pdf",
    });

    return { url };
  }

  /**
   * Upload a REAL file (user provided) to Cloudinary.
   * @param fileBuffer - actual file bytes
   * @param originalName - original filename (for key naming)
   * @param contentType - e.g. "image/jpeg"
   * @param userId - for folder structure (optional)
   */
  public async uploadAvatarToCloudinary(
    fileBuffer: Buffer,
    originalName: string,
    contentType: string | undefined,
    userId: number
  ) {
    // Basic safety: only images for avatar
    if (contentType && !contentType.startsWith("image/")) {
      return (
        {
          ok: false,
          error: "Only image files allowed",
        }
      );
    }

    const ext = originalName.includes(".")
      ? originalName.split(".").pop()
      : "jpg";

    // Your CloudinaryDisk strips extension for public_id; that's fine.
    const key = `users/${userId}/avatars/${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const res = await this.cloudinaryDisk().put(fileBuffer, key, {
      contentType: contentType ?? "application/octet-stream",
    });

    return {
      ok: true,
      driver: "cloudinary",
      key: res.key, // this will be Cloudinary public_id
      url: res.url, // Cloudinary secure URL
      size: res.size,
      contentType: res.contentType,
    };
  }

  /**
   * Upload avatar to AWS S3 using your Storage abstraction.
   * - Validates contentType (must be image/*)
   * - Generates safe key: users/{userId}/avatars/{timestamp}_{rand}.{ext}
   * - Uploads with correct contentType + cache control
   * - Returns key + url (public) OR signedUrl (private)
   */
  public async uploadAvatarToS3(
    fileBuffer: Buffer,
    originalName: string,
    contentType: string | undefined,
    opts?: {
      isPublic?: boolean;            // default true
      maxBytes?: number;             // default 5MB
      signedExpiresSeconds?: number; // only used when isPublic=false
    }
  ) {
    const isPublic = opts?.isPublic ?? true;
    const maxBytes = opts?.maxBytes ?? 5 * 1024 * 1024;
    const user = await this.getAuthUser();
    const userId = user?.id;

    // Size guard (optional but recommended)
    if (fileBuffer.length > maxBytes) {
      return { ok: false as const, error: `Avatar too large (max ${maxBytes} bytes)` };
    }

    // Type guard
    if (contentType && !contentType.startsWith("image/")) {
      return { ok: false as const, error: "Only image files allowed" };
    }

    // Decide extension
    const extFromName =
      originalName.includes(".") ? originalName.split(".").pop()?.toLowerCase() : undefined;

    const ext =
      extFromName && extFromName.length <= 8
        ? extFromName
        : contentType?.split("/")[1]?.toLowerCase() || "jpg";

    const safeRand = Math.random().toString(16).slice(2);
    const key = `users/${userId}/avatars/${Date.now()}_${safeRand}.${ext}`;

    // ✅ Use your S3 disk (pick whichever style your Storage supports)
    // If you have: this.disk("s3") use that. If you have: this.s3Disk() use that.
    const s3 = (this as any).disk ? (this as any).disk("s3") : (this as any).s3Disk();
    
    const res = await s3.put(fileBuffer, key, {
      contentType: contentType ?? "application/octet-stream",
      // Your storage layer may support these (safe to include if supported):
      visibility: isPublic ? "public" : "private",
      cacheControl: "public, max-age=31536000, immutable",
      // metadata: { userId: String(userId), kind: "avatar" },
    });

    // If public, url is usually res.url (or disk.url(key)).
    // If private, return signed URL.
    if (isPublic) {
      return {
        ok: true as const,
        driver: "s3",
        key: res.key ?? key,
        url: res.url ?? (await s3.url?.(key)), // depending on your abstraction
        size: res.size ?? fileBuffer.length,
        contentType: res.contentType ?? contentType,
      };
    }

    const signedUrl = await s3.signedUrl(key, {
      expiresInSeconds: opts?.signedExpiresSeconds ?? 60 * 10,
      // downloadName is optional for avatars; you can omit it.
    });

    return {
      ok: true as const,
      driver: "s3",
      key: res.key ?? key,
      url: signedUrl,
      size: res.size ?? fileBuffer.length,
      contentType: res.contentType ?? contentType,
    };
  }
}
