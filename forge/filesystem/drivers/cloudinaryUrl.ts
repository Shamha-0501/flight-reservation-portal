import { v2 as cloudinary } from "cloudinary";

export type CloudinaryTransform = {
  // Common
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "thumb" | "limit" | "pad" | "lfill";
  gravity?: string; // e.g. "auto", "face", "center"
  quality?: "auto" | number;
  format?: "auto" | "jpg" | "png" | "webp" | "avif";
  fetchFormat?: "auto" | "jpg" | "png" | "webp" | "avif"; // alias for Cloudinary "f_"
  dpr?: "auto" | number;

  // Visual extras
  radius?: number | "max";
  background?: string; // e.g. "white", "transparent"
  effect?: string; // e.g. "sharpen", "grayscale"
};

export type CloudinaryUrlOptions = {
  secure?: boolean; // default true
  resourceType?: "image" | "video" | "raw" | "auto"; // default "image"
  // Delivery type:
  // - "upload" for normal public assets
  // - "authenticated" for authenticated delivery (signed)
  type?: "upload" | "authenticated";
  signUrl?: boolean; // cloudinary option; for authenticated should be true
  transformation?: CloudinaryTransform;
  // download content disposition
  downloadName?: string; // if set, uses fl_attachment:downloadName
};

const transformToCloudinary = (t?: CloudinaryTransform) => {
  if (!t) return undefined;

  const parts: any = {};

  if (t.width) parts.width = t.width;
  if (t.height) parts.height = t.height;
  if (t.crop) parts.crop = t.crop;
  if (t.gravity) parts.gravity = t.gravity;
  if (t.quality !== undefined) parts.quality = t.quality;
  if (t.format) parts.format = t.format;
  if (t.fetchFormat) parts.fetch_format = t.fetchFormat;
  if (t.dpr !== undefined) parts.dpr = t.dpr;

  if (t.radius !== undefined) parts.radius = t.radius;
  if (t.background) parts.background = t.background;
  if (t.effect) parts.effect = t.effect;

  return [parts];
};

/**
 * Build a Cloudinary URL for a public_id using optional transformations.
 * Works for:
 * - public upload delivery
 * - authenticated delivery (signed URLs) if enabled in your Cloudinary account
 */
export const cloudinaryUrl = (
  publicId: string,
  opts?: CloudinaryUrlOptions
): string => {
  const secure = opts?.secure ?? true;
  const resourceType = opts?.resourceType ?? "image";
  const type = opts?.type ?? "upload";

  const transformation = transformToCloudinary(opts?.transformation);

  // Download flag via fl_attachment (optional)
  const flags = opts?.downloadName
    ? [`attachment:${opts.downloadName}`] // "fl_attachment:filename"
    : undefined;

  return cloudinary.url(publicId, {
    secure,
    resource_type: resourceType,
    type,
    sign_url: opts?.signUrl,
    transformation,
    flags,
  });
}

/**
 * Convenience: build a CDN-style "optimized image URL"
 * You can pass just width/height/format/quality etc.
 */
export const cloudinaryImageUrl = (
  publicId: string,
  t?: CloudinaryTransform
): string => {
  return cloudinaryUrl(publicId, {
    secure: true,
    resourceType: "image",
    type: "upload",
    transformation: {
      fetchFormat: t?.fetchFormat ?? t?.format ?? "auto",
      quality: t?.quality ?? "auto",
      ...t,
    },
  });
}

/**
 * Authenticated signed URL builder (requires Cloudinary authenticated delivery).
 * This is the "real private" helper.
 */
export const cloudinaryAuthenticatedSignedUrl = (
  publicId: string,
  t?: CloudinaryTransform,
  downloadName?: string
): string => {
  return cloudinaryUrl(publicId, {
    secure: true,
    resourceType: "image",
    type: "authenticated",
    signUrl: true,
    transformation: {
      fetchFormat: t?.fetchFormat ?? t?.format ?? "auto",
      quality: t?.quality ?? "auto",
      ...t,
    },
    downloadName,
  });
}
