import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateCurrencyTable extends Migration {
  async up() {
    await Schema.create("currencies", (table) => {
      table.bigIncrements("id");
      table.string('code', 3).unique();
      table.string('name', 100);
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("currencies");
  }
}
