export async function up(knex) {
  await knex.schema.createTable('byt_password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('byt_users').onDelete('CASCADE');
    table.string('token').notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('byt_password_resets');
}
