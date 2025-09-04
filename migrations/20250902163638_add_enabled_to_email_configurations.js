/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.boolean('enabled').defaultTo(true).notNullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_email_configurations', function(table) {
    table.dropColumn('enabled');
  });
}
