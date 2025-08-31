/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_otp_records', function(table) {
    table.increments('id').primary();
    table.string('phone').notNullable();
    table.string('email').nullable();
    table.string('otp').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_otp_records');
};
