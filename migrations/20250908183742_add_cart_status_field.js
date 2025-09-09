/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasStatusColumn = await knex.schema.hasColumn('byt_carts', 'status');
  if (!hasStatusColumn) {
    await knex.schema.alterTable('byt_carts', (table) => {
      table.string('status').defaultTo('pending').notNullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasStatusColumn = await knex.schema.hasColumn('byt_carts', 'status');
  if (hasStatusColumn) {
    await knex.schema.alterTable('byt_carts', (table) => {
      table.dropColumn('status');
    });
  }
}
