import knex from '../../../config/db.js';

const TABLE_NAME = 'byt_vehicle_management';

export async function getAllVehicles() {
  return knex(TABLE_NAME).where({ is_active: true });
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
