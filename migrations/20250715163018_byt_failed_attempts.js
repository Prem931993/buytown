export async function up(knex) {
  await knex.schema.createTable('byt_failed_attempts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('byt_users').onDelete('CASCADE');
    table.string('identity').notNullable();
    table.integer('attempt_count').defaultTo(0);
    table.timestamp('last_attempt_at').defaultTo(knex.fn.now());
    table.unique(['user_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('byt_failed_attempts');
};
