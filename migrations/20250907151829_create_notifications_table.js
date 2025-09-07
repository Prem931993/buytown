/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_notifications', function(table) {
    table.increments('id').primary();
    table.string('type').notNullable(); // order, product, user, system
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.string('recipient_type').notNullable().defaultTo('admin'); // admin, user, all
    table.integer('recipient_id').unsigned().nullable(); // user id if specific user
    table.string('reference_type').nullable(); // order, product, user, etc.
    table.integer('reference_id').unsigned().nullable(); // order id, product id, etc.
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign('recipient_id').references('id').inTable('byt_users').onDelete('SET NULL');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('byt_notifications');
}
