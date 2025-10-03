export async function up(knex) {
  // Add new columns to user_sessions table for device management
  await knex.schema.alterTable('byt_user_sessions', (table) => {
    table.string('device_name').nullable();
    table.string('browser').nullable();
    table.string('browser_version').nullable();
    table.string('os').nullable();
    table.string('os_version').nullable();
    table.string('device_type').nullable(); // mobile, tablet, desktop
    table.string('location').nullable(); // city, country if available
    table.boolean('is_current_session').defaultTo(false);
    table.timestamp('last_activity').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  // Remove the added columns
  await knex.schema.alterTable('byt_user_sessions', (table) => {
    table.dropColumn('device_name');
    table.dropColumn('browser');
    table.dropColumn('browser_version');
    table.dropColumn('os');
    table.dropColumn('os_version');
    table.dropColumn('device_type');
    table.dropColumn('location');
    table.dropColumn('is_current_session');
    table.dropColumn('last_activity');
  });
}
