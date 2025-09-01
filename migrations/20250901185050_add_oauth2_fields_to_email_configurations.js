/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.string('mail_user').nullable();
    table.string('mail_client_id').nullable();
    table.string('mail_client_secret').nullable();
    table.string('mail_refresh_token').nullable();
    table.string('mail_access_token').nullable();
    table.timestamp('token_expires_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.dropColumn('mail_user');
    table.dropColumn('mail_client_id');
    table.dropColumn('mail_client_secret');
    table.dropColumn('mail_refresh_token');
    table.dropColumn('mail_access_token');
    table.dropColumn('token_expires_at');
  });
};
