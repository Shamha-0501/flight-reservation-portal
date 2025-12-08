import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateUserTable extends Migration {
  async up() {
    await Schema.create("users", (table) => {
      table.bigIncrements("id");
      table.string('email');
      table.string('password', 256);
      table.bigInteger('role_id').unsigned().nullable();
      table.string('remember_token');
      table.boolean('verified');
      table.boolean('subscribe_news_letter');
      table.timestamps();
      table.softDeletes();
      
      table.foreign('role_id')
        .references('id')
        .on('roles')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("users");
  }
}
