export async function up(knex) {
  // First, drop the constraint
  await knex.raw('ALTER TABLE byt_products DROP CONSTRAINT IF EXISTS byt_products_status_check');
  
  // Then drop the status column
  await knex.schema.table('byt_products', function (table) {
    table.dropColumn('status');
  });
  
  // Add the new status column as smallint and deleted_at column
  return knex.schema.table('byt_products', function (table) {
    table.smallint('status').defaultTo(1);
    table.timestamp('deleted_at').nullable();
  });
}

export async function down(knex) {
  // Drop the new columns
  await knex.schema.table('byt_products', function (table) {
    table.dropColumn('status');
    table.dropColumn('deleted_at');
  });
  
  // Add back the original status column
  return knex.schema.table('byt_products', function (table) {
    table.enum('status', ['active', 'out_of_stock', 'discontinued']).defaultTo('active');
  });
}