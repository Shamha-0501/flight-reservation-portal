import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateDistrictTable extends Migration {
  async up() {
    await Schema.create("districts", (table) => {
      table.bigIncrements("id");
      table.bigInteger('province_id').unsigned().nullable();
      table.string('name_en');
      table.string('name_si');
      table.string('name_ta');
      table.timestamps();
      table.softDeletes();
      
      table.foreign('province_id')
        .references('id')
        .on('provinces')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("districts");
  }
}
