import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class MigrationTable extends Migration {
    async up() {
        await Schema.create('migrations', (table) => {
            table.bigIncrements('id');
            table.string('migration').unique();
            table.integer('runs');
            table.integer('rollbacks');
            table.timestamps(); 
        });
    }

    async down() {
        Schema.dropIfExists('migrations');
    }
}