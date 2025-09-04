/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  // Create vehicle management table
  return knex.schema
    .createTable('byt_vehicle_management', function(table) {
      table.increments('id').primary();
      table.string('vehicle_type').notNullable(); // e.g., "Two Wheeler", "Cargo", "Tata Ace", "Pickup", "EICHER 407"
      table.decimal('rate_per_km', 8, 2).notNullable(); // Rate in INR per km
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create delivery settings table
      return knex.schema.createTable('byt_delivery_settings', function(table) {
        table.increments('id').primary();
        table.string('center_point').notNullable(); // e.g., "RS Puram"
        table.integer('delivery_radius_km').notNullable().defaultTo(10); // Radius in km from center point
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('byt_delivery_settings')
    .then(() => {
      return knex.schema.dropTableIfExists('byt_vehicle_management');
    });
};
