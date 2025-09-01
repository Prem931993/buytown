/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('byt_tax_configurations', function(table) {
    table.increments('id').primary();
    table.string('tax_name').notNullable();
    table.decimal('tax_rate', 5, 2).notNullable(); // e.g., 18.00 for 18%
    table.string('tax_type').notNullable(); // 'GST', 'VAT', 'Sales Tax', etc.
    table.boolean('is_active').defaultTo(true);
    table.text('description').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('byt_tax_configurations');
};
