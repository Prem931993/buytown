export async function up(knex) {
  return knex.schema.createTable('byt_product_images', function (table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.string('image_path').notNullable();
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_primary').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_product_images');
}