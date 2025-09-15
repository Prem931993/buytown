export const up = async (knex) => {
  await knex.schema.createTable('byt_pending_notifications', (table) => {
    table.increments('id').primary();
    table.string('type').notNullable(); // 'product', 'order', 'promotion', 'category', etc.
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.string('reference_type').nullable(); // 'product', 'order', 'category', etc.
    table.integer('reference_id').nullable();
    table.string('notification_type').notNullable().defaultTo('broadcast'); // 'broadcast', 'specific_users', 'wishlist_users'
    table.json('target_user_ids').nullable(); // For specific_users type
    table.boolean('processed').notNullable().defaultTo(false);
    table.timestamp('processed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

export const down = async (knex) => {
  await knex.schema.dropTable('byt_pending_notifications');
};
