/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_orders', function(table) {
    table.increments('id').primary();
    table.string('order_number').unique().notNullable();
    table.integer('user_id').unsigned().references('id').inTable('byt_users').onDelete('CASCADE');
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('status').notNullable().defaultTo('awaiting_confirmation'); // awaiting_confirmation, confirmed, processing, shipped, delivered, cancelled
    table.string('payment_status').notNullable().defaultTo('pending'); // pending, paid, failed, refunded
    table.string('delivery_vehicle').nullable(); // Vehicle used for delivery
    table.string('delivery_driver').nullable(); // Driver name
    table.string('delivery_address').nullable();
    table.string('delivery_phone').nullable();
    table.text('notes').nullable();
    table.timestamp('order_date').defaultTo(knex.fn.now());
    table.timestamp('delivery_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('byt_orders');
};
