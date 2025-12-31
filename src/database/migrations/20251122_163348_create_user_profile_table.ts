import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class CreateUserProfileTable extends Migration {
  async up() {
    await Schema.create("user_profiles", (table) => {
      table.bigIncrements("id");
      table.bigInteger('user_id').unsigned().notNullable();
      table.bigInteger('country_id').unsigned().nullable();
      table.bigInteger('province_id').unsigned().nullable();
      table.bigInteger('district_id').unsigned().nullable();
      table.bigInteger('city_id').unsigned().nullable();
      table.enum('title', ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Rev.', 'Hon.']);
      table.string('fname', 100).notNullable();
      table.string('lname', 100).nullable();
      table.string('profile_url', 100).nullable();
      table.string('code').nullable();
      table.string('mobile', 20).nullable();
      table.boolean('mobile_verified').nullable();
      table.string('whatsapp', 20).nullable();
      table.string('nic', 12).nullable();
      table.date('date_of_birth').nullable();
      table.json('social_media').nullable();
      table.json('contact_method').nullable();
      table.string('address').nullable();
      table.text('bio').nullable();
      table.timestamps();
      table.softDeletes();
      
      table.foreign('user_id')
        .references('id')
        .on('users')
        .onDelete('CASCADE');
      table.foreign('country_id')
        .references('id')
        .on('countries')
        .onDelete('CASCADE');
      table.foreign('province_id')
        .references('id')
        .on('provinces')
        .onDelete('CASCADE');
      table.foreign('district_id')
        .references('id')
        .on('districts')
        .onDelete('CASCADE');
      table.foreign('city_id')
        .references('id')
        .on('cities')
        .onDelete('CASCADE');
    });
  }

  async down() {
    await Schema.dropIfExists("user_profiles");
  }
}
