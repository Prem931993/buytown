export async function up(knex) {
  return knex.schema.table('byt_products', function (table) {
    // Add new columns
    table.integer('subcategory_id').unsigned().references('id').inTable('byt_categories').onDelete('SET NULL');
    table.string('color');
    table.string('size_dimension');
    table.string('unit');
    table.decimal('weight_kg', 8, 3);
    table.decimal('length_mm', 8, 2);
    table.decimal('width_mm', 8, 2);
    table.decimal('height_mm', 8, 2);
    table.decimal('selling_price', 10, 2);
    table.decimal('discount', 5, 2);
    table.decimal('gst', 5, 2);
    table.integer('min_order_qty').defaultTo(1);
    table.boolean('delivery_flag').defaultTo(true);
  });
}

export async function down(knex) {
  return knex.schema.table('byt_products', function (table) {
    // Drop columns in reverse order
    table.dropColumn('delivery_flag');
    table.dropColumn('min_order_qty');
    table.dropColumn('gst');
    table.dropColumn('discount');
    table.dropColumn('selling_price');
    table.dropColumn('height_mm');
    table.dropColumn('width_mm');
    table.dropColumn('length_mm');
    table.dropColumn('weight_kg');
    table.dropColumn('unit');
    table.dropColumn('size_dimension');
    table.dropColumn('color');
    table.dropColumn('subcategory_id');
  });
}