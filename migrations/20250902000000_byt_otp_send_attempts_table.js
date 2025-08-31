/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_otp_send_attempts', function(table) {
    table.increments('id').primary();
    table.string('phone').notNullable();
    table.integer('user_id').nullable();
    table.timestamp('attempt_date').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    // Index for efficient queries
    table.index(['phone', 'attempt_date']);
    table.index(['user_id', 'attempt_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_otp_send_attempts');
};
