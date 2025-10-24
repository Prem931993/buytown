/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.string('text_color').defaultTo('#000000');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.dropColumn('text_color');
  });
};
