/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_sms_configurations', function(table) {
    table.increments('id').primary();
    table.string('provider').notNullable(); // e.g., 'twilio', 'nexmo', 'whatsapp'
    table.string('api_key').notNullable();
    table.string('api_secret').notNullable();
    table.string('additional_config').nullable(); // JSON string for any extra config
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_sms_configurations');
};
