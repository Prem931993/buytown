export async function up(knex) {
  return knex.schema.createTable('byt_product_variations', function (table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.integer('variation_id').unsigned().notNullable().references('id').inTable('byt_variations').onDelete('CASCADE');
    table.decimal('price', 10, 2);
    table.integer('stock').defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_product_variations');
}