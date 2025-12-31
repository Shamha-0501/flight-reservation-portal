import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import mime from "mime-types";

import type {
  StorageDisk,
  PutOptions,
  PutResult,
  GetResult,
  SignedUrlOptions,
  Visibility,
} from "../types";
import { safeJoin, hmacSign, normalizeKey } from "../utils";

export type LocalDiskOptions = {
  root: string;
  visibility: Visibility;
  publicBaseUrl?: string; // used for visibility=public url()
  privateServeBaseUrl?: string; // used for signedUrl() when private
  signSecret: string; // FILE_SIGN_SECRET
  privateRoutePath?: string; // default "/files/private"
};

export class LocalDisk implements StorageDisk {
  private root: string;
  private visibility: Visibility;
  private publicBaseUrl?: string;
  private privateServeBaseUrl?: string;
  private signSecret: string;
  private privateRoutePath: string;

  constructor(opts: LocalDiskOptions) {
    this.root = opts.root;
    this.visibility = opts.visibility;
    this.publicBaseUrl = opts.publicBaseUrl;
    this.privateServeBaseUrl = opts.privateServeBaseUrl;
    this.signSecret = opts.signSecret;
    this.privateRoutePath = opts.privateRoutePath ?? "/files/private";
  }

  private fullPath(key: string) {
    return safeJoin(this.root, normalizeKey(key));
  }

  async put(
    data: Buffer,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const fp = this.fullPath(key);
    await fsp.mkdir(path.dirname(fp), { recursive: true });
    await fsp.writeFile(fp, data);

    return {
      key: normalizeKey(key),
      url: this.url(key),
      etag: crypto.createHash("md5").update(data).digest("hex"),
      size: data.length,
      contentType:
        options?.contentType ?? (mime.lookup(key) || null)?.toString() ?? null,
    };
  }

  async putFile(
    filePath: string,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const fp = this.fullPath(key);
    await fsp.mkdir(path.dirname(fp), { recursive: true });
    await pipeline(fs.createReadStream(filePath), fs.createWriteStream(fp));
    const st = await fsp.stat(fp);

    return {
      key: normalizeKey(key),
      url: this.url(key),
      size: st.size,
      contentType:
        options?.contentType ?? (mime.lookup(key) || null)?.toString() ?? null,
    };
  }

  async putStream(
    stream: Readable,
    key: string,
    options?: PutOptions
  ): Promise<PutResult> {
    const fp = this.fullPath(key);
    await fsp.mkdir(path.dirname(fp), { recursive: true });
    await pipeline(stream, fs.createWriteStream(fp));
    const st = await fsp.stat(fp);

    return {
      key: normalizeKey(key),
      url: this.url(key),
      size: st.size,
      contentType:
        options?.contentType ?? (mime.lookup(key) || null)?.toString() ?? null,
    };
  }

  async get(key: string): Promise<GetResult> {
    const fp = this.fullPath(key);
    const st = await fsp.stat(fp);

    return {
      stream: fs.createReadStream(fp),
      size: st.size,
      contentType: (mime.lookup(key) || null)?.toString() ?? null,
      etag: null,
    };
  }

  async delete(key: string): Promise<boolean> {
    const fp = this.fullPath(key);
    try {
      await fsp.unlink(fp);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fp = this.fullPath(key);
    try {
      await fsp.access(fp);
      return true;
    } catch {
      return false;
    }
  }

  async copy(fromKey: string, toKey: string): Promise<boolean> {
    const from = this.fullPath(fromKey);
    const to = this.fullPath(toKey);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    await fsp.copyFile(from, to);
    return true;
  }

  async move(fromKey: string, toKey: string): Promise<boolean> {
    const from = this.fullPath(fromKey);
    const to = this.fullPath(toKey);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    await fsp.rename(from, to);
    return true;
  }

  url(key: string): string | null {
    if (this.visibility !== "public") return null;
    if (!this.publicBaseUrl) return null;
    const base = this.publicBaseUrl.replace(/\/$/, "");
    return `${base}/${normalizeKey(key)}`;
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    // Public local disk: just normal url
    if (this.visibility === "public") {
      const u = this.url(key);
      if (!u)
        throw new Error("Public base url is missing for local public disk");
      return u;
    }

    // Private local disk: return signed API route
    const base = (this.privateServeBaseUrl ?? "").replace(/\/$/, "");
    if (!base) throw new Error("privateServeBaseUrl missing (APP_URL)");

    const exp =
      Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? 300);
    const k = normalizeKey(key);
    const dn = options?.downloadName ?? "";
    const payload = `${k}:${exp}:${dn}`;
    const sig = hmacSign(payload, this.signSecret);

    const qp = new URLSearchParams();
    qp.set("key", k);
    qp.set("exp", String(exp));
    qp.set("sig", sig);
    if (dn) qp.set("download", dn);

    return `${base}${this.privateRoutePath}?${qp.toString()}`;
  }
}
