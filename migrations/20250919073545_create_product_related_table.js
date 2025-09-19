export async function up(knex) {
  return knex.schema.createTable('byt_product_related', function (table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.integer('related_product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.timestamps(true, true);

    // Ensure no duplicate relationships
    table.unique(['product_id', 'related_product_id']);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_product_related');
}
