export async function up(knex) {
  return knex.schema.createTable('byt_variations', function (table) {
    table.increments('id').primary();
    table.string('label').notNullable();
    table.string('value').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_variations');
}