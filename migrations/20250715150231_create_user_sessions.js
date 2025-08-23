export async function up(knex) {
  await knex.schema.createTable('byt_user_sessions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('byt_users').onDelete('CASCADE');
    table.text('refresh_token').notNullable();
    table.string('user_agent');
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('byt_user_sessions');
}