import { Readable } from "node:stream";
import mime from "mime-types";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  StorageDisk,
  PutOptions,
  PutResult,
  GetResult,
  SignedUrlOptions,
  Visibility,
} from "../types";
import { normalizeKey } from "../utils";

export type S3DiskOptions = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  visibility?: Visibility; // default private
  publicBaseUrl?: string; // optional CDN
};

export class S3Disk implements StorageDisk {
  private client: S3Client;
  private bucket: string;
  private visibility: Visibility;
  private publicBaseUrl?: string;

  constructor(opts: S3DiskOptions) {
    this.bucket = opts.bucket;
    this.visibility = opts.visibility ?? "private";
    this.publicBaseUrl = opts.publicBaseUrl;

    this.client = new S3Client({
      region: opts.region,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async put(
    data: Buffer,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const k = normalizeKey(key);
    const visibility = options?.visibility ?? this.visibility;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: k,
        Body: data,
        ContentType:
          options?.contentType ?? (mime.lookup(k) || undefined)?.toString(),
        CacheControl: options?.cacheControl,
        Metadata: options?.metadata,
        ACL: visibility === "public" ? "public-read" : undefined,
      })
    );

    return {
      key: k,
      url: visibility === "public" ? this.url(k) : null,
      size: data.length,
      contentType:
        options?.contentType ?? (mime.lookup(k) || null)?.toString() ?? null,
    };
  }

  async putFile(
    filePath: string,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    // stream upload
    const fs = await import("node:fs");
    return this.putStream(fs.createReadStream(filePath), key, options);
  }

  async putStream(
    stream: Readable,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const k = normalizeKey(key);
    const visibility = options?.visibility ?? this.visibility;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: k,
        Body: stream,
        ContentType:
          options?.contentType ?? (mime.lookup(k) || undefined)?.toString(),
        CacheControl: options?.cacheControl,
        Metadata: options?.metadata,
        ACL: visibility === "public" ? "public-read" : undefined,
      })
    );

    return {
      key: k,
      url: visibility === "public" ? this.url(k) : null,
      contentType:
        options?.contentType ?? (mime.lookup(k) || null)?.toString() ?? null,
    };
  }

  async get(key: string): Promise<GetResult> {
    const k = normalizeKey(key);
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: k })
    );
    const body = res.Body;

    if (!body || !(body instanceof Readable)) {
      // In some runtimes it may not be Readable; handle basic fallback
      throw new Error("S3 get(): unsupported body stream type");
    }

    return {
      stream: body,
      size: res.ContentLength ?? null,
      contentType: (res.ContentType ?? null) as any,
      etag: (res.ETag ?? null) as any,
    };
  }

  async delete(key: string): Promise<boolean> {
    const k = normalizeKey(key);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: k })
    );
    return true;
  }

  async exists(key: string): Promise<boolean> {
    const k = normalizeKey(key);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: k })
      );
      return true;
    } catch {
      return false;
    }
  }

  async copy(fromKey: string, toKey: string): Promise<boolean> {
    const from = normalizeKey(fromKey);
    const to = normalizeKey(toKey);

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${from}`,
        Key: to,
        ACL: this.visibility === "public" ? "public-read" : undefined,
      })
    );

    return true;
  }

  async move(fromKey: string, toKey: string): Promise<boolean> {
    await this.copy(fromKey, toKey);
    await this.delete(fromKey);
    return true;
  }

  url(key: string): string | null {
    const k = normalizeKey(key);
    if (this.visibility !== "public") return null;
    if (this.publicBaseUrl)
      return `${this.publicBaseUrl.replace(/\/$/, "")}/${k}`;
    return `https://${this.bucket}.s3.amazonaws.com/${k}`;
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const k = normalizeKey(key);

    // if public, you can just return public URL
    if (this.visibility === "public") {
      const u = this.url(k);
      if (u) return u;
    }

    const expiresIn = options?.expiresInSeconds ?? 300;

    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: k,
      ResponseContentDisposition: options?.downloadName
        ? `attachment; filename="${options.downloadName}"`
        : undefined,
    });

    return getSignedUrl(this.client, cmd, { expiresIn });
  }
}
