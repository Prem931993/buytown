export async function seed(knex) {
  // Insert vehicle management data
  await knex('byt_vehicle_management').insert([
    { vehicle_type: 'Two Wheeler', rate_per_km: 15.00, is_active: true },
    { vehicle_type: 'Cargo', rate_per_km: 35.00, is_active: true },
    { vehicle_type: 'Tata Ace', rate_per_km: 45.00, is_active: true },
    { vehicle_type: 'Pickup', rate_per_km: 55.00, is_active: true },
    { vehicle_type: 'EICHER 407', rate_per_km: 70.00, is_active: true }
  ]);

  // Insert delivery settings data
  await knex('byt_delivery_settings').insert([
    { center_point: 'RS Puram', delivery_radius_km: 10, is_active: true }
  ]);
};
