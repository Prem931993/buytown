/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.table('byt_vehicle_management', function(table) {
    table.decimal('base_charge', 8, 2).notNullable().defaultTo(0); // Base charge for up to max_distance_km
    table.integer('max_distance_km').notNullable().defaultTo(5); // Distance covered by base charge
    table.decimal('additional_charge_per_km', 8, 2).notNullable().defaultTo(0); // Additional charge per km beyond max_distance_km
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.table('byt_vehicle_management', function(table) {
    table.dropColumn('base_charge');
    table.dropColumn('max_distance_km');
    table.dropColumn('additional_charge_per_km');
  });
};
