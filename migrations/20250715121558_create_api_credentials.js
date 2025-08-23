// migrations/20230716_create_api_credentials.js
export async function up(knex) {
  await knex.schema.createTable('byt_api_credentials', (table) => {
    table.increments('id').primary();
    table.string('client_id').notNullable().unique();
    table.string('client_secret').notNullable();
    table.smallint('role').notNullable().comment('1 = admin, 2 = user');
    table.boolean('status').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('byt_api_credentials');
}
