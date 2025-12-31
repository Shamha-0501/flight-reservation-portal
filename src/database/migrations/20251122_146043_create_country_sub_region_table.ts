import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateCountrySubRegionTable extends Migration {
  async up() {
    await Schema.create("country_sub_regions", (table) => {
      table.bigIncrements("id");
      table.bigInteger('region_id').unsigned();
      table.string('sub_region_name', 100);
      table.timestamps();
      table.softDeletes();

      table.foreign('region_id')
        .references('id')
        .on('country_regions')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("country_sub_regions");
  }
}
