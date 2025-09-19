/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.table('byt_products', function(table) {
    table.string('hsn_code').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.table('byt_products', function(table) {
    table.dropColumn('hsn_code');
  });
};
