import knex from '../../../config/db.js';

const TABLE_NAME = 'byt_vehicle_management';
const USER_VEHICLE_TABLE = 'byt_user_vehicle';

export async function getAllVehicles() {
  const vehicles = await knex(TABLE_NAME).where({ is_active: true });

  // Add delivery persons for each vehicle
  for (let vehicle of vehicles) {
    const deliveryPersons = await getDeliveryPersonsByVehicle(vehicle.id);
    vehicle.deliveryPersons = deliveryPersons;
  }

  return vehicles;
}

export async function getVehicleById(id) {
  return knex(TABLE_NAME).where({ id, is_active: true }).first();
}

export async function createVehicle(vehicle) {
  return knex(TABLE_NAME).insert(vehicle).returning('*');
}

export async function updateVehicle(id, vehicle) {
  return knex(TABLE_NAME).where({ id }).update(vehicle).returning('*');
}

export async function deleteVehicle(id) {
  return knex(TABLE_NAME).where({ id }).update({ is_active: false });
}

// Get delivery persons assigned to a specific vehicle
export async function getDeliveryPersonsByVehicle(vehicleId) {
  return knex('byt_users as u')
    .join('byt_user_vehicle as uv', 'u.id', 'uv.user_id')
    .join('byt_roles as r', 'u.role_id', 'r.id')
    .where('uv.vehicle_id', vehicleId)
    .andWhere('r.name', 'delivery_person')
    .andWhere('u.status', 1) // 1 = active status (smallint)
    .select(
      'u.id',
      knex.raw("CONCAT(u.firstname, ' ', u.lastname) as name"),
      'u.email',
      'u.phone_no as phone'
    );
}

// Get all vehicles with their assigned delivery persons count
export async function getVehiclesWithDeliveryPersonCount() {
  const vehicles = await knex(TABLE_NAME)
    .where({ is_active: true })
    .select('*');

  // Add delivery person count for each vehicle
  for (let vehicle of vehicles) {
    const deliveryPersons = await getDeliveryPersonsByVehicle(vehicle.id);
    vehicle.delivery_person_count = deliveryPersons.length;
    vehicle.delivery_persons = deliveryPersons;
  }

  return vehicles;
}
