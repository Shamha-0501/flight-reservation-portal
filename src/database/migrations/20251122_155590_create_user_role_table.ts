import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateUserRoleTable extends Migration {
  async up() {
    await Schema.create("user_roles", (table) => {
      table.bigIncrements("id");
      table.bigInteger('user_id').unsigned();
      table.bigInteger('role_id').unsigned();
      table.timestamps();
      table.softDeletes();

      table.foreign('user_id')
        .references('id')
        .on('users')
        .onDelete('CASCADE');

      table.foreign('role_id')
        .references('id')
        .on('roles')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("user_roles");
  }
}
