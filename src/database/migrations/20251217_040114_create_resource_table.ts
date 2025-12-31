import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateResourceTable extends Migration {
  async up() {
    await Schema.create("resources", (table) => {
      table.bigIncrements("id");
      table.string('key', 100);
      table.string('description');
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("resources");
  }
}
