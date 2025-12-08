import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateCityTable extends Migration {
  async up() {
    await Schema.create("cities", (table) => {
      table.bigIncrements("id");
      table.bigInteger('district_id').unsigned().nullable();
      table.string('name', 100);
      table.string('sub_name', 100);
      table.string('postal_code', 45);
      table.double('longitude');
      table.double('latitude');
      table.timestamps();
      table.softDeletes();
      
      table.foreign('district_id')
        .references('id')
        .on('districts')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("cities");
  }
}
