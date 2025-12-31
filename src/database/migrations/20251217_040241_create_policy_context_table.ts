import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreatePolicyContextTable extends Migration {
  async up() {
    await Schema.create("policy_contexts", (table) => {
      table.bigIncrements("id");
      table.bigInteger('policy_id').unsigned();
      table.string('key', 10);
      table.string('value', 20);
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("policy_contexts");
  }
}
