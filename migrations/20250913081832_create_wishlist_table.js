/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_wishlist_items', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().index();
    table.integer('product_id').unsigned().notNullable().index();
    table.integer('variation_id').unsigned().nullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('byt_users').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('byt_products').onDelete('CASCADE');
    table.foreign('variation_id').references('id').inTable('byt_product_variations').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_wishlist_items');
};
