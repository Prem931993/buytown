import knex from '../../../config/db.js';

export async function createPaymentConfiguration(data) {
  const [config] = await knex('byt_payment_configurations').insert(data).returning('*');
  return config;
}

export async function getPaymentConfiguration(gatewayName) {
  return await knex('byt_payment_configurations').where({ gateway_name: gatewayName }).first();
}

export async function getAllPaymentConfigurations() {
  return await knex('byt_payment_configurations').select('*');
}

export async function updatePaymentConfiguration(id, data) {
  const [config] = await knex('byt_payment_configurations').where({ id }).update(data).returning('*');
  return config;
}

export async function deletePaymentConfiguration(id) {
  return await knex('byt_payment_configurations').where({ id }).del();
}
