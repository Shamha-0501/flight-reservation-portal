import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreatePolicyTable extends Migration {
  async up() {
    await Schema.create("policies", (table) => {
      table.bigIncrements("id");
      table.string('name');
      table.string('effect');
      table.integer('priority');
      table.bigInteger('resource_id').unsigned();
      table.bigInteger('action_id').unsigned();
      table.json('condition').nullable();
      table.boolean('enabled');
      table.timestamps();
      table.softDeletes();

      table.foreign('resource_id')
        .references('id')
        .on('resources')
        .onDelete('CASCADE');

      table.foreign('action_id')
        .references('id')
        .on('actions')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("policies");
  }
}
