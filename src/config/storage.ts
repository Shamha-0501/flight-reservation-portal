import type { StorageConfig } from "@/forge/filesystem/config";
import { config } from "dotenv";

config({ quiet: true });

export const storageConfig: StorageConfig = {
    defaultDisk: process.env.FILE_SYSTEM_DISK ?? "public",
    fileSignSecret: process.env.FILE_SIGN_SECRET ?? "dev-secret",
    privateServeBaseUrl: process.env.APP_URL ?? "http://localhost:3000",
    disks: {
        public: {
            driver:"local",
            root: process.env.LOCAL_PUBLIC_ROOT ?? "storage/public",
            visibility: "public",
            publicBaseUrl: process.env.LOCAL_PUBLIC_URL ?? "http://localhost:3000",
        },
        private: {
            driver: "local",
            root: process.env.LOCAL_PRIVATE_ROOT ?? "storage/private",
            visibility: "private",
        },
        s3_public: {
            driver: "s3",
            bucket: process.env.AWS_BUCKET!,
            region: process.env.AWS_REGION!,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            visibility: "public",
            publicBaseUrl: process.env.AWS_PUBLIC_CDN_URL, // optional
        }, 
        s3_private: {
            driver: "s3",
            bucket: process.env.AWS_BUCKET!,
            region: process.env.AWS_REGION!,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            visibility: "private",
        },
        cloudinary: {
            driver: "cloudinary",
            cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
            apiKey: process.env.CLOUDINARY_API_KEY!,
            apiSecret: process.env.CLOUDINARY_API_SECRET!,
            folder: process.env.CLOUDINARY_FOLDER,
        }
    }
};