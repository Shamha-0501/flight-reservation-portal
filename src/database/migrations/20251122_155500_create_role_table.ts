import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateRoleTable extends Migration {
  async up() {
    await Schema.create("roles", (table) => {
      table.bigIncrements("id");
      table.string('role_key', 50);
      table.string('display_name', 50);
      table.string('default_scope', 10);
      table.boolean('is_external').default(false);
      table.string('description');
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("roles");
  }
}
