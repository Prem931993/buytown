import knex from '../../../config/db.js';

export async function createTaxConfiguration(data) {
  const [config] = await knex('byt_tax_configurations').insert(data).returning('*');
  return config;
}

export async function getTaxConfiguration(id) {
  return await knex('byt_tax_configurations').where({ id }).first();
}

export async function getAllTaxConfigurations() {
  return await knex('byt_tax_configurations').select('*');
}

export async function updateTaxConfiguration(id, data) {
  const [config] = await knex('byt_tax_configurations').where({ id }).update(data).returning('*');
  return config;
}

export async function deleteTaxConfiguration(id) {
  return await knex('byt_tax_configurations').where({ id }).del();
}
