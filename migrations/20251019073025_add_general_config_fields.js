/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.string('primary_color').nullable();
    table.string('secondary_color').nullable();
    table.string('background_image').nullable();
    table.decimal('minimum_order_value', 10, 2).nullable();
    table.integer('abandoned_cart_expiry_hours').nullable();
    table.integer('low_stock_quantity').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('byt_general_settings', function(table) {
    table.dropColumn('primary_color');
    table.dropColumn('secondary_color');
    table.dropColumn('background_image');
    table.dropColumn('minimum_order_value');
    table.dropColumn('abandoned_cart_expiry_hours');
    table.dropColumn('low_stock_quantity');
  });
};
