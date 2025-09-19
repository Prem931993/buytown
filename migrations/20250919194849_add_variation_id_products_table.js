export async function up(knex) {
  return knex.schema.table('byt_products', function (table) {
    table.integer('variation_id').unsigned().nullable().references('id').inTable('byt_variations').onDelete('SET NULL');
  });
}

export async function down(knex) {
  return knex.schema.table('byt_products', function (table) {
    table.dropColumn('variation_id');
  });
}
