export async function up(knex) {
  return knex.schema.createTable('byt_products', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.integer('category_id').unsigned().references('id').inTable('byt_categories').onDelete('SET NULL');
    table.integer('brand_id').unsigned().references('id').inTable('byt_brands').onDelete('SET NULL');
    table.string('sku_code').unique();
    table.integer('stock').defaultTo(0);
    table.enum('status', ['active', 'out_of_stock', 'discontinued']).defaultTo('active');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_products');
}