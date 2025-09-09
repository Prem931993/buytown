/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasDeliveryPersonId = await knex.schema.hasColumn('byt_orders', 'delivery_person_id');
  if (!hasDeliveryPersonId) {
    await knex.schema.alterTable('byt_orders', (table) => {
      table.integer('delivery_person_id').unsigned().nullable();
      table.float('delivery_distance').nullable();
      table.decimal('delivery_charges', 10, 2).nullable();
      table.string('rejection_reason').nullable();
      table.foreign('delivery_person_id').references('id').inTable('byt_users').onDelete('SET NULL');
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasDeliveryPersonId = await knex.schema.hasColumn('byt_orders', 'delivery_person_id');
  if (hasDeliveryPersonId) {
    await knex.schema.alterTable('byt_orders', (table) => {
      table.dropForeign(['delivery_person_id']);
      table.dropColumn('delivery_person_id');
      table.dropColumn('delivery_distance');
      table.dropColumn('delivery_charges');
      table.dropColumn('rejection_reason');
    });
  }
}
