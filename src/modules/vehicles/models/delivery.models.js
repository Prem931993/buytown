import knex from '../../../config/db.js';

const TABLE_NAME = 'byt_delivery_settings';

export async function getAllDeliverySettings() {
  return knex(TABLE_NAME).orderBy('created_at');
}

export async function getDeliverySettings() {
  return knex(TABLE_NAME).where({ is_active: true }).first();
}

export async function createDeliverySetting(setting) {
  return knex(TABLE_NAME).insert(setting).returning('*');
}

export async function updateDeliverySetting(id, setting) {
  return knex(TABLE_NAME).where({ id }).update(setting).returning('*');
}

export async function deleteDeliverySetting(id) {
  return knex(TABLE_NAME).where({ id }).update({ is_active: false }).returning('*');
}

export async function updateDeliverySettings(settings) {
  // First, deactivate all existing settings
  await knex(TABLE_NAME).update({ is_active: false });

  // Then insert new settings
  return knex(TABLE_NAME).insert(settings).returning('*');
}
