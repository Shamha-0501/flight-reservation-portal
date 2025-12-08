import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateProvinceTable extends Migration {
  async up() {
    await Schema.create("provinces", (table) => {
      table.bigIncrements("id");
      table.bigInteger('country_id').unsigned().nullable();
      table.string('name_en');
      table.string('name_si');
      table.string('name_ta');
      table.timestamps();
      table.softDeletes();

      table.foreign('country_id')
        .references('id')
        .on('countries')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("provincets");
  }
}
