import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
  fromFactory,
} from "@/forge/database/seeder/dataSource";
import { User, UserAttr } from "@/src/http/models/User";
import crypto from "crypto";
import { config } from "dotenv";
import { UserFactory } from "../factories/UserFactory";
import { hashPassword } from "@/forge/security/password";

config({ quiet: true });

type UserInput = Omit<UserAttr, "id" | "remember_token" | "subscribe_news_letter" | "tenant_id">;

export class UserSeeder extends ModelSeeder<UserInput> {
    name = 'UserSeeder';
    model = User;

    // ---------- Only for seed admin crediencials -----------
    source = fromArray<UserInput>([
        {
            email: process.env.ADMIN_EMAIL || 'test@example.com',
            password: hashPassword(process.env.ADMIN_PASSWORD || 'test'),
            role: process.env.ADMIN_ROLE || 'user',
            verified: process.env.ADMIN_VERIFIED === "true" || false,
        }
    ]);

    // source = fromFactory<UserInput>(new UserFactory().generate(10));

    mapRow(row: any): UserInput {
        return {
            email: row.email,
            password: row.password,
            role: row.role,
            verified: row.verified,
        };
    };

    upsert = {
        uniqueBy: ['email'],
        update: ['password', 'role', 'verified', 'tenant_id']
    }

    chunkSize = 500;
}