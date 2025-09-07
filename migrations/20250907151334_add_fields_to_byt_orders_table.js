/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.table('byt_orders', function(table) {
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('shipping_amount', 10, 2).notNullable().defaultTo(0);
    table.string('payment_method').nullable();
    table.text('billing_address').nullable();
    table.text('shipping_address').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.table('byt_orders', function(table) {
    table.dropColumn('subtotal');
    table.dropColumn('tax_amount');
    table.dropColumn('discount_amount');
    table.dropColumn('shipping_amount');
    table.dropColumn('payment_method');
    table.dropColumn('billing_address');
    table.dropColumn('shipping_address');
  });
}
