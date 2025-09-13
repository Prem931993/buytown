/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_general_settings', function(table) {
    table.increments('id').primary();
    table.string('company_name').nullable();
    table.text('company_details').nullable();
    table.string('facebook_link').nullable();
    table.string('twitter_link').nullable();
    table.string('youtube_link').nullable();
    table.string('instagram_link').nullable();
    table.string('linkedin_link').nullable();
    table.string('phone_number').nullable();
    table.string('gstin_number').nullable();
    table.string('company_email').nullable();
    table.string('company_phone_number').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_general_settings');
};
