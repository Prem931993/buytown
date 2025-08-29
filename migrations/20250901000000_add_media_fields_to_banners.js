export async function up(knex) {
  return knex.schema.table('byt_banners', function (table) {
    table.string('media_type', 50).defaultTo('image').notNullable(); // image, video, youtube
    table.string('link_url', 500).nullable();
    table.string('link_target', 20).nullable(); // _blank, _self
  });
}

export async function down(knex) {
  return knex.schema.table('byt_banners', function (table) {
    table.dropColumn('media_type');
    table.dropColumn('link_url');
    table.dropColumn('link_target');
  });
}
