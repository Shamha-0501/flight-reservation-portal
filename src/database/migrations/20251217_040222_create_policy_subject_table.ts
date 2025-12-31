import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreatePolicySubjectTable extends Migration {
  async up() {
    await Schema.create("policy_subjects", (table) => {
      table.bigIncrements("id");
      table.bigInteger('policy_id').unsigned();
      table.string('subject_type', 20);
      table.string('subject_value', 20);
      table.timestamps();
      table.softDeletes();

      table.foreign('policy_id')
        .references('id')
        .on('policies')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("policy_subjects");
  }
}
