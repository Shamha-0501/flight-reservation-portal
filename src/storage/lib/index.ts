import "server-only";

import { StorageManager } from "@/forge/filesystem/storage";
import { storageConfig } from "@/src/config/storage";

export const Storage = new StorageManager(storageConfig);
