/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.boolean('terms_agreed').defaultTo(false);
    table.timestamp('terms_agreed_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('byt_users', function(table) {
    table.dropColumn('terms_agreed');
    table.dropColumn('terms_agreed_at');
  });
};
