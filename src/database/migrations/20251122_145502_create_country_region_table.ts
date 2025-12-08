import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateCountryRegionTable extends Migration {
  async up() {
    await Schema.create("country_regions", (table) => {
      table.bigIncrements("id");
      table.string('region_name').notNullable();
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("country_regions");
  }
}
