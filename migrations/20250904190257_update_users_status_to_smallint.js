/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Rename existing status column to temp_status
  await knex.schema.alterTable('byt_users', function(table) {
    table.renameColumn('status', 'temp_status');
  });

  // Add new smallint status column with default value 1 (active)
  await knex.schema.alterTable('byt_users', function(table) {
    table.smallint('status').defaultTo(1).notNullable();
  });

  // Migrate data from temp_status to new status column
  // true -> 1 (active), false -> 2 (inactive)
  await knex('byt_users').update({
    status: knex.raw("CASE WHEN temp_status = true THEN 1 ELSE 2 END")
  });

  // Drop the temp_status column
  await knex.schema.alterTable('byt_users', function(table) {
    table.dropColumn('temp_status');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Rename existing status column to temp_status
  await knex.schema.alterTable('byt_users', function(table) {
    table.renameColumn('status', 'temp_status');
  });

  // Add back the boolean status column with default true
  await knex.schema.alterTable('byt_users', function(table) {
    table.boolean('status').defaultTo(true);
  });

  // Migrate data from temp_status to boolean status
  // 1 -> true, others -> false
  await knex('byt_users').update({
    status: knex.raw("CASE WHEN temp_status = 1 THEN true ELSE false END")
  });

  // Drop the temp_status column
  await knex.schema.alterTable('byt_users', function(table) {
    table.dropColumn('temp_status');
  });
}
