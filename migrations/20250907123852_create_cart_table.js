/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create cart header table if it doesn't exist
  const cartTableExists = await knex.schema.hasTable('byt_carts');
  if (!cartTableExists) {
    await knex.schema.createTable('byt_carts', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('byt_users').onDelete('CASCADE');

      // Unique constraint to ensure one cart per user
      table.unique('user_id');
    });
  }

  // Create cart items table if it doesn't exist
  const cartItemsTableExists = await knex.schema.hasTable('byt_cart_items');
  if (!cartItemsTableExists) {
    await knex.schema.createTable('byt_cart_items', function(table) {
      table.increments('id').primary();
      table.integer('cart_id').unsigned().notNullable();
      table.integer('product_id').unsigned().notNullable();
      table.integer('variation_id').unsigned().nullable();
      table.integer('quantity').notNullable().defaultTo(1);
      table.decimal('price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      // Foreign key constraints
      table.foreign('cart_id').references('id').inTable('byt_carts').onDelete('CASCADE');
      table.foreign('product_id').references('id').inTable('byt_products').onDelete('CASCADE');
      table.foreign('variation_id').references('id').inTable('byt_product_variations').onDelete('SET NULL');

      // Unique constraint to prevent duplicate cart items
      table.unique(['cart_id', 'product_id', 'variation_id']);
    });
  }

  // Create order items table if it doesn't exist
  const orderItemsTableExists = await knex.schema.hasTable('byt_order_items');
  if (!orderItemsTableExists) {
    await knex.schema.createTable('byt_order_items', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable();
      table.integer('product_id').unsigned().notNullable();
      table.integer('variation_id').unsigned().nullable();
      table.integer('quantity').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Foreign key constraints
      table.foreign('order_id').references('id').inTable('byt_orders').onDelete('CASCADE');
      table.foreign('product_id').references('id').inTable('byt_products').onDelete('CASCADE');
      table.foreign('variation_id').references('id').inTable('byt_product_variations').onDelete('SET NULL');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('byt_order_items');
  await knex.schema.dropTableIfExists('byt_cart_items');
  await knex.schema.dropTableIfExists('byt_carts');
  // Note: byt_orders table is not dropped here as it was created by a different migration
};
