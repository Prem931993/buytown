/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_payment_configurations', function(table) {
    table.increments('id').primary();
    table.string('gateway_name').notNullable(); // 'razorpay', 'stripe', etc.
    table.string('api_key').notNullable();
    table.string('api_secret').notNullable();
    table.string('webhook_secret').nullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_sandbox').defaultTo(true); // For testing mode
    table.string('currency').defaultTo('INR');
    table.text('description').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_payment_configurations');
};
