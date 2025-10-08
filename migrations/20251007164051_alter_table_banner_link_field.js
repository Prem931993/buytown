export async function up(knex) {
  return knex.schema.table('byt_banners', function (table) {
    // Drop old columns
    table.dropColumn('link_url');
    table.dropColumn('link_target');

    // Add new columns
    table.enu('link_type', ['category', 'product']).nullable();
    table.integer('link_id').nullable();
  });
}

export async function down(knex) {
  return knex.schema.table('byt_banners', function (table) {
    // Drop new columns
    table.dropColumn('link_type');
    table.dropColumn('link_id');

    // Add back old columns
    table.string('link_url', 500).nullable();
    table.string('link_target', 20).nullable();
  });
}
