/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Drop the existing enum column and recreate it with the new values
  await knex.schema.alterTable('byt_email_configurations', function(table) {
    table.dropColumn('config_type');
  });
  await knex.schema.alterTable('byt_email_configurations', function(table) {
    table.enu('config_type', ['smtp', 'gmail_app_password', 'oauth2', 'sendgrid']).defaultTo('smtp').notNullable();
    table.string('sendgrid_api_key').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.dropColumn('sendgrid_api_key');
    table.dropColumn('config_type');
  });
  await knex.schema.alterTable('byt_email_configurations', function(table) {
    table.enu('config_type', ['smtp', 'gmail_app_password', 'oauth2']).defaultTo('smtp').notNullable();
  });
};
