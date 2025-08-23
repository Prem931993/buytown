export async function up(knex) {
  return knex.schema.createTable('byt_categories', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.string('image');
    table.integer('parent_id').unsigned().references('id').inTable('byt_categories').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('byt_categories');
}