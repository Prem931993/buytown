/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.table('byt_vehicle_management', function(table) {
    table.dropColumn('rate_per_km');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.table('byt_vehicle_management', function(table) {
    table.decimal('rate_per_km', 8, 2).notNullable();
  });
};
