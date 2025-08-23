export async function up(knex) {
  return knex.schema.createTable('byt_brands', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('description');
    table.string('image');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_brands');
}