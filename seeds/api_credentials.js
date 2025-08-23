export async function seed(knex) {
 await knex.raw(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
};