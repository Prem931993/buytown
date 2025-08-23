export function up(knex) {
  return knex.schema.createTable('byt_users', table => {
    table.increments('id').primary();
    table.string('username');
    table.string('email').unique();
    table.string('phone_no').unique();
    table.string('password');
    table.string('gstin').unique().nullable();
    table.string('address').nullable();
    table.smallint('role_id').references('id').inTable('byt_roles').onDelete('CASCADE');
    table.boolean('status').defaultTo(true);
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTable('byt_users');
}
