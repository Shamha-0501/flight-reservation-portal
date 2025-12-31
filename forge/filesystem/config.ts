import type { Visibility } from "./types";

export type StorageConfig = {
  defaultDisk: string;
  fileSignSecret: string; // Used by local-private signed URLs
  privateServeBaseUrl?: string; // Base URL of your API (for local private signed route)
  disks: Record<
    string,
    | {
        driver: "local";
        root: string;
        visibility: Visibility;
        publicBaseUrl?: string; // for public disk URL generation
      }
    | {
        driver: "s3";
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        visibility?: Visibility; // default private
        publicBaseUrl?: string; // optional CDN
      }
    | {
        driver: "cloudinary";
        cloudName: string;
        apiKey: string;
        apiSecret: string;
        folder?: string;
      }
  >;
};
