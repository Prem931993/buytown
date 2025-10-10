export async function up(knex) {
  // Create payments table
  const paymentsTableExists = await knex.schema.hasTable('byt_payments');
  if (!paymentsTableExists) {
    await knex.schema.createTable('byt_payments', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('byt_orders').onDelete('CASCADE');
      table.string('payment_gateway').notNullable(); // 'cashfree', 'phonepe', etc.
      table.string('gateway_order_id').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('INR');
      table.string('status').notNullable(); // 'created', 'pending', 'paid', 'failed', 'cancelled'
      table.text('gateway_response').nullable();
      table.string('error_message').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id', 'payment_gateway']);
      table.index('gateway_order_id');
    });
  }

  // Create payment refunds table
  const refundsTableExists = await knex.schema.hasTable('byt_payment_refunds');
  if (!refundsTableExists) {
    await knex.schema.createTable('byt_payment_refunds', (table) => {
      table.increments('id').primary();
      table.integer('payment_id').unsigned().notNullable().references('id').inTable('byt_payments').onDelete('CASCADE');
      table.string('refund_id').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('reason').nullable();
      table.string('status').notNullable(); // 'initiated', 'processed', 'failed'
      table.text('gateway_response').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('payment_id');
      table.index('refund_id');
    });
  }
}

export async function down(knex) {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('byt_payment_refunds');
  await knex.schema.dropTableIfExists('byt_payments');
}
