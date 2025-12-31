import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateUserTable extends Migration {
  async up() {
    await Schema.create("users", (table) => {
      table.bigIncrements("id");
      table.string('email');
      table.string('password', 256);
      table.string('role', 20).nullable();
      table.string('remember_token').nullable();
      table.boolean('verified').default(0);
      table.boolean('subscribe_news_letter').default(0);
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("users");
  }
}
