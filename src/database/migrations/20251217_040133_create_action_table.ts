import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateActionTable extends Migration {
  async up() {
    await Schema.create("actions", (table) => {
      table.bigIncrements("id");
      table.string('key', 15);
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("actions");
  }
}
