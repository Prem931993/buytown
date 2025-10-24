import knex from '../../../config/db.js';

const TABLE_NAME = 'byt_vehicle_management';
const USER_VEHICLE_TABLE = 'byt_user_vehicle';

export async function getAllVehicles() {
  const vehicles = await knex(TABLE_NAME).where({ is_active: true });

  // Add delivery persons and ongoing orders count for each vehicle
  for (let vehicle of vehicles) {
    const deliveryPersons = await getDeliveryPersonsByVehicle(vehicle.id);
    vehicle.deliveryPersons = deliveryPersons;
    vehicle.ongoing_orders_count = await getOngoingOrdersCountByVehicle(vehicle.id);
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

// Get ongoing orders count for a specific delivery person
export async function getOngoingOrdersCountByDeliveryPerson(deliveryPersonId) {
  return knex('byt_orders')
    .where('delivery_person_id', deliveryPersonId)
    .andWhere('status', 'in', ['approved', 'confirmed', 'processing', 'shipped'])
    .count('id as count')
    .first()
    .then(result => parseInt(result.count) || 0);
}

// Get ongoing orders count for a specific vehicle (sum of its delivery persons' orders)
export async function getOngoingOrdersCountByVehicle(vehicleId) {
  const deliveryPersons = await getDeliveryPersonsByVehicle(vehicleId);
  let totalCount = 0;
  for (let person of deliveryPersons) {
    totalCount += await getOngoingOrdersCountByDeliveryPerson(person.id);
  }
  return totalCount;
}

// Calculate delivery charges based on vehicle configuration and distance
export async function calculateDeliveryCharge(vehicleId, distanceKm) {
  const vehicle = await knex(TABLE_NAME)
    .where({ id: vehicleId, is_active: true })
    .select('base_charge', 'max_distance_km', 'additional_charge_per_km')
    .first();

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const { base_charge, max_distance_km, additional_charge_per_km } = vehicle;

  let totalCharge = parseFloat(base_charge || 0);

  if (distanceKm > max_distance_km) {
    const extraDistance = distanceKm - max_distance_km;
    const extraCharge = extraDistance * parseFloat(additional_charge_per_km || 0);
    totalCharge += extraCharge;
  }

  return {
    base_charge: parseFloat(base_charge || 0),
    max_distance_km: parseInt(max_distance_km || 5),
    additional_charge_per_km: parseFloat(additional_charge_per_km || 0),
    distance_km: distanceKm,
    total_charge: totalCharge
  };
}
