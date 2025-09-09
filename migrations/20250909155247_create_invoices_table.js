/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_invoices', function(table) {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable();
    table.foreign('order_id').references('id').inTable('byt_orders').onDelete('CASCADE');
    table.string('invoice_type', 50).notNullable(); // 'invoice' or 'order_confirmation'
    table.string('file_name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.string('file_size', 50); // Size in bytes
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Index for faster queries
    table.index(['order_id', 'invoice_type']);
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('byt_invoices');
};
