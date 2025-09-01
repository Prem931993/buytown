import knex from '../../../config/db.js';

export async function createEmailConfiguration(data) {
  const [config] = await knex('byt_email_configurations').insert(data).returning('*');
  return config;
}

export async function getEmailConfiguration() {
  return await knex('byt_email_configurations').first();
}

export async function getAllEmailConfigurations() {
  return await knex('byt_email_configurations').select('*');
}

export async function updateEmailConfiguration(id, data) {
  const [config] = await knex('byt_email_configurations').where({ id }).update(data).returning('*');
  return config;
}

export async function deleteEmailConfiguration(id) {
  return await knex('byt_email_configurations').where({ id }).del();
}
