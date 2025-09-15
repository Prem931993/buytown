/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_orders', function(table) {
    table.integer('status_updated_by').unsigned().references('id').inTable('byt_users').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_orders', function(table) {
    table.dropColumn('status_updated_by');
  });
};
