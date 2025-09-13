/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.json('selected_categories').nullable(); // Store array of category IDs with order
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.dropColumn('selected_categories');
  });
};
