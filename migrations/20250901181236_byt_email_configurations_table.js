/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_email_configurations', function(table) {
    table.increments('id').primary();
    table.string('smtp_host').notNullable();
    table.integer('smtp_port').notNullable();
    table.string('smtp_user').notNullable();
    table.string('smtp_password').notNullable();
    table.boolean('smtp_secure').defaultTo(false);
    table.string('from_email').notNullable();
    table.string('from_name').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_email_configurations');
};
