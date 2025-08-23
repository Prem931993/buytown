export function up(knex) {
  return knex.schema.createTable('byt_roles', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
  });
}

export function down(knex) {
  return knex.schema.dropTable('byt_roles');
}