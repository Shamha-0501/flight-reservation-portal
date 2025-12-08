import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateCountryTable extends Migration {
  async up() {
    await Schema.create("countries", (table) => {
      table.bigIncrements("id");
      table.string('name', 191);
      table.string('alpha_2_code', 2);
      table.string('alpha_3_code', 191);
      table.bigInteger('sub_region_id').unsigned().nullable();
      table.double('longitude');
      table.double('latitude');
      table.string('demonym', 191);
      table.string('flag', 191);
      table.timestamps();
      table.softDeletes();
      
      table.foreign('sub_region_id')
        .references('id')
        .on('country_regions')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("countries");
  }
}
