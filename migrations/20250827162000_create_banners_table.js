export async function up(knex) {
  return knex.schema.createTable('byt_banners', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.integer('order_index').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_banners');
}