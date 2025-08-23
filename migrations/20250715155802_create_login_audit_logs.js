// migrations/20230716_create_login_audit_logs.js
export async function up(knex) {
  await knex.schema.createTable('byt_login_audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('byt_users').onDelete('SET NULL');
    table.string('identity').notNullable();
    table.string('ip_address').notNullable();
    table.string('user_agent');
    table.boolean('success').defaultTo(false);
    table.string('attempt_type').notNullable(); // login, logout, etc.
    table.smallint('role').nullable().comment('1 = admin, 2 = user');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('byt_login_audit_logs');
}
