import type { StorageDisk } from "./types";
import type { StorageConfig } from "./config";
import { LocalDisk } from "./drivers/local";
import { S3Disk } from "./drivers/s3";
import { CloudinaryDisk } from "./drivers/cloudinary";

export class StorageManager {
  private cache = new Map<string, StorageDisk>();

  constructor(private config: StorageConfig) {}

  disk(name?: string): StorageDisk {
    const diskName = name ?? this.config.defaultDisk;
    const existing = this.cache.get(diskName);
    if (existing) return existing;

    const cfg = this.config.disks[diskName];
    if (!cfg) throw new Error(`Storage disk not found: ${diskName}`);

    let disk: StorageDisk;

    if (cfg.driver === "local") {
      disk = new LocalDisk({
        root: cfg.root,
        visibility: cfg.visibility,
        publicBaseUrl: cfg.publicBaseUrl,
        privateServeBaseUrl: this.config.privateServeBaseUrl,
        signSecret: this.config.fileSignSecret,
      });
    } else if (cfg.driver === "s3") {
      disk = new S3Disk({
        bucket: cfg.bucket,
        region: cfg.region,
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
        visibility: cfg.visibility,
        publicBaseUrl: cfg.publicBaseUrl,
      });
    } else if (cfg.driver === "cloudinary") {
      disk = new CloudinaryDisk({
        cloudName: cfg.cloudName,
        apiKey: cfg.apiKey,
        apiSecret: cfg.apiSecret,
        folder: cfg.folder,
        useAuthenticatedDelivery: true, // set true if you enabled authenticated delivery
      });
    } else {
      throw new Error("Unsupported storage driver");
    }

    this.cache.set(diskName, disk);
    return disk;
  }
}
