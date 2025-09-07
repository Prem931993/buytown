/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('byt_pages', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('content').notNullable();
    table.enu('status', ['draft', 'published']).defaultTo('draft');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('byt_pages');
}
