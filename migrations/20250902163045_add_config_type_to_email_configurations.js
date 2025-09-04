/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.enu('config_type', ['smtp', 'gmail_app_password', 'oauth2']).defaultTo('smtp').notNullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.dropColumn('config_type');
  });
}
