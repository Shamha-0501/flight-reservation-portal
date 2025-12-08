import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateSessionsTable extends Migration {
  async up() {
    await Schema.create("sessions", (table) => {
      table.string("id", 128).primary();     // session ID
      table.bigInteger("user_id").unsigned().nullable();
      table.text("payload");                 // JSON data if needed
      table.string("ip_address", 45).nullable();
      table.string("user_agent").nullable();
      table.timestamp("last_activity");      // for expiry
    });
  }

  async down() {
    await Schema.dropIfExists("sessions");
  }
}