import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { Role, type RoleAttr } from "@/src/http/models/Role";

type RoleSeedInput = Omit<RoleAttr, "id">;

export class RoleSeeder extends ModelSeeder<RoleSeedInput> {
  name = "RoleSeeder";
  model = Role;

  source = fromArray<RoleSeedInput>([
    {
      role_key: "super_admin",
      display_name: "Super Admin",
      default_scope: "*",
      is_external: false,
      description: "Full system access",
    },
    {
      role_key: "admin",
      display_name: "Admin",
      default_scope: "tenant",
      is_external: false,
      description: "Tenant administrator",
    },
    {
      role_key: "provider",
      display_name: "Provider",
      default_scope: "tenant",
      is_external: false,
      description: "Property agent",
    },
    {
      role_key: "user",
      display_name: "User",
      default_scope: "self",
      is_external: false,
      description: "Standard user",
    },
  ]);

  // no-op for array rows; but required for csv too
  mapRow(row: any): RoleSeedInput {
    // If array source, row is already correct shape
    return {
      role_key: row.role_key,
      display_name: row.display_name,
      default_scope: row.default_scope,
      is_external:
        typeof row.is_external === "string"
          ? row.is_external === "true" || row.is_external === "1"
          : !!row.is_external,
      description: row.description ?? "",
    };
  }

  upsert = {
    uniqueBy: ["role_key"],
    update: ["display_name", "default_scope", "is_external", "description"],
  };

  chunkSize = 500; // roles are tiny; any number is fine
}
