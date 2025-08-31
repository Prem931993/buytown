export function up(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.string('firstname').nullable();
    table.string('lastname').nullable();
    table.string('profile_photo').nullable();
    table.string('license').nullable(); // For delivery persons
  });
}

export function down(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.dropColumn('firstname');
    table.dropColumn('lastname');
    table.dropColumn('profile_photo');
    table.dropColumn('license');
  });
}
