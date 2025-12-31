import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import { fromArray } from "@/forge/database/seeder/dataSource";
import { UserRole, UserRoleAttr } from "@/src/http/models/UserRole";
import { User } from "@/src/http/models/User";
import { Role } from "@/src/http/models/Role"; // if you have a separate Role model
import { config } from "dotenv";

config({ quiet: true });

type UserRoleInput = Omit<UserRoleAttr, "id">;

export class UserRoleSeeder extends ModelSeeder<UserRoleInput> {
  name = "UserRoleSeeder";
  model = UserRole;

  source = fromArray<UserRoleInput>([]);

  async run() {
    const adminRole = process.env.ADMIN_ROLE;
    if (!adminRole) {
      throw new Error("ADMIN_ROLE env is not set");
    }
    const role = await (Role as any)
      .query()
      .where("role_key = ?", [adminRole])
      .first();

    if (!role) {
      throw new Error("Role 'super_admin' not found");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL env is not set");
    }

    const user = await (User as any)
      .query()
      .where("email = ?", [adminEmail])
      .first();

    if (!user) {
      throw new Error(`User with email ${adminEmail} not found`);
    }

    this.source = fromArray<UserRoleInput>([
      {
        role_id: role.id,
        user_id: user.id,
      },
    ]);

    await super.run();
  };

  mapRow(row: any): UserRoleInput {
    return {
      role_id: row.role_id,
      user_id: row.user_id, // ✅ fixed typo
    };
  };

  upsert = {
    uniqueBy: ["user_id"],
    update: ["role_id"],
  };

  chunkSize = 500;
}
