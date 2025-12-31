import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import mime from "mime-types";

import type {
  StorageDisk,
  PutOptions,
  PutResult,
  GetResult,
  SignedUrlOptions,
} from "../types";
import { normalizeKey } from "../utils";
import {
  cloudinaryUrl,
  cloudinaryImageUrl,
  cloudinaryAuthenticatedSignedUrl,
  type CloudinaryTransform,
} from "./cloudinaryUrl";
import { fetchStreamByUrl } from "./fetchUrlStream";

export type CloudinaryDiskOptions = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;

  // If true, signedUrl() uses authenticated delivery
  // (your Cloudinary account must have authenticated delivery enabled)
  useAuthenticatedDelivery?: boolean;
};

export class CloudinaryDisk implements StorageDisk {
  private folder?: string;
  private useAuthenticatedDelivery: boolean;

  constructor(opts: CloudinaryDiskOptions) {
    cloudinary.config({
      cloud_name: opts.cloudName,
      api_key: opts.apiKey,
      api_secret: opts.apiSecret,
    });

    this.folder = opts.folder;
    this.useAuthenticatedDelivery = opts.useAuthenticatedDelivery ?? false;
  }

  private toPublicId(key: string) {
    // Cloudinary public_id doesn't need extension; remove to avoid duplicates.
    const k = normalizeKey(key);
    const withoutExt = k.replace(/\.[^/.]+$/, "");
    return this.folder ? `${this.folder}/${withoutExt}` : withoutExt;
  }

  /**
   * Extra helpers (public methods)
   */
  public imageUrl(publicId: string, t?: CloudinaryTransform) {
    return cloudinaryImageUrl(publicId, t);
  }

  public rawUrl(publicId: string) {
    return cloudinaryUrl(publicId, {
      secure: true,
      resourceType: "auto",
      type: "upload",
    });
  }

  public authenticatedUrl(
    publicId: string,
    t?: CloudinaryTransform,
    downloadName?: string
  ) {
    return cloudinaryAuthenticatedSignedUrl(publicId, t, downloadName);
  }

  async put(
    data: Buffer,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const publicId = this.toPublicId(key);

    const res = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: "auto",
          overwrite: true,
          // You can also pass tags/context here
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(data);
    });

    return {
      key: publicId,
      url: res.secure_url ?? null,
      etag: res.etag ?? null,
      size: res.bytes ?? null,
      contentType:
        options?.contentType ?? (mime.lookup(key) || null)?.toString() ?? null,
    };
  }

  async putFile(
    filePath: string,
    key: string,
    _options?: PutOptions
  ): Promise<PutResult> {
    const publicId = this.toPublicId(key);

    const res = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      resource_type: "auto",
      overwrite: true,
    });

    return {
      key: publicId,
      url: res.secure_url ?? null,
      etag: (res as any).etag ?? null,
      size: (res as any).bytes ?? null,
      contentType: (res as any).resource_type
        ? `${(res as any).resource_type}/*`
        : null,
    };
  }

  async putStream(
    stream: Readable,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    // Prefer upload_stream; we collect chunks then upload.
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return this.put(Buffer.concat(chunks), key, options);
  }

  /**
   * get(): Cloudinary is URL-first, but sometimes you need a stream.
   * We fetch the asset via URL and return a Readable stream.
   */
  async get(key: string): Promise<GetResult> {
    // key is stored as public_id in this disk
    const publicId = key;

    // If authenticated delivery enabled, fetch via signed URL
    const url = this.useAuthenticatedDelivery
      ? this.authenticatedUrl(publicId)
      : this.url(publicId) ?? "";

    if (!url) throw new Error("CloudinaryDisk.get(): unable to build URL");

    const res = await fetchStreamByUrl(url);
    return {
      stream: res.stream,
      contentType: (res.headers["content-type"] as any) ?? null,
      size: res.headers["content-length"]
        ? Number(res.headers["content-length"])
        : null,
      etag: (res.headers["etag"] as any) ?? null,
    };
  }

  async delete(key: string): Promise<boolean> {
    await cloudinary.uploader.destroy(key, { resource_type: "auto" });
    return true;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(key, { resource_type: "auto" });
      return true;
    } catch {
      return false;
    }
  }

  async copy(_fromKey: string, _toKey: string): Promise<boolean> {
    throw new Error(
      "CloudinaryDisk.copy() not supported directly (re-upload if needed)."
    );
  }

  async move(_fromKey: string, _toKey: string): Promise<boolean> {
    throw new Error(
      "CloudinaryDisk.move() not supported directly (re-upload if needed)."
    );
  }

  url(key: string): string | null {
    // Normal public delivery URL
    return (
      cloudinaryUrl(key, {
        secure: true,
        resourceType: "auto",
        type: "upload",
      }) || null
    );
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    // If authenticated delivery is enabled in config, return signed authenticated URL.
    // Otherwise return the normal URL.
    const downloadName = options?.downloadName;
    if (this.useAuthenticatedDelivery) {
      return this.authenticatedUrl(key, undefined, downloadName);
    }
    const u = this.url(key);
    if (!u) throw new Error("CloudinaryDisk.signedUrl(): unable to build URL");
    return u;
  }
}
