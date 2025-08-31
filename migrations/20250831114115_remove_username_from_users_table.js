export function up(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.dropColumn('username');
  });
}

export function down(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.string('username').nullable();
  });
}
