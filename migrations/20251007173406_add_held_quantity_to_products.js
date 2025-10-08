/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable('byt_products', function(table) {
    table.integer('held_quantity').defaultTo(0).after('stock');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('byt_products', function(table) {
    table.dropColumn('held_quantity');
  });
};
