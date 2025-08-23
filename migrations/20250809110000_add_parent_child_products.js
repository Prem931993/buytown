export async function up(knex) {
  // Add product_type column to byt_products table
  await knex.schema.table('byt_products', function (table) {
    table.enum('product_type', ['simple', 'parent', 'child']).defaultTo('simple');
    table.integer('parent_product_id').unsigned().references('id').inTable('byt_products').onDelete('SET NULL');
  });

  // Create junction table for parent-child product relationships
  await knex.schema.createTable('byt_product_parent_child', function (table) {
    table.increments('id').primary();
    table.integer('parent_product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.integer('child_product_id').unsigned().notNullable().references('id').inTable('byt_products').onDelete('CASCADE');
    table.unique(['parent_product_id', 'child_product_id']);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  // Drop the junction table
  await knex.schema.dropTableIfExists('byt_product_parent_child');

  // Remove columns from byt_products table
  await knex.schema.table('byt_products', function (table) {
    table.dropColumn('parent_product_id');
    table.dropColumn('product_type');
  });
}