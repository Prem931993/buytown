export async function up(knex) {
  return knex.schema.createTable('byt_logos', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_logos');
}