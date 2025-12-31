import type { Readable } from "node:stream";

export type Visibility = "public" | "private";

export type PutOptions = {
  contentType?: string;
  visibility?: Visibility;
  cacheControl?: string;
  metadata?: Record<string, string>;
};

export type SignedUrlOptions = {
  expiresInSeconds?: number;
  downloadName?: string;
};

export type PutResult = {
  key: string;
  url?: string | null;
  etag?: string | null;
  size?: number | null;
  contentType?: string | null;
};

export type GetResult = {
  stream: Readable;
  contentType?: string | null;
  size?: number | null;
  etag?: string | null;
};

export interface StorageDisk {
  put(data: Buffer, key: string, options?: PutOptions): Promise<PutResult>;
  putFile(
    filePath: string,
    key: string,
    options?: PutOptions
  ): Promise<PutResult>;
  putStream(
    stream: Readable,
    key: string,
    options?: PutOptions
  ): Promise<PutResult>;

  get(key: string): Promise<GetResult>;

  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;

  copy(fromKey: string, toKey: string): Promise<boolean>;
  move(fromKey: string, toKey: string): Promise<boolean>;

  url(key: string): string | null;
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}
