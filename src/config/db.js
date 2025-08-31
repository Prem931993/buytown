import knex from 'knex';
import { development, production } from '../../knexfile.js';

// Decide environment: default to development unless NODE_ENV=production
const environment = process.env.NODE_ENV === 'production' ? production : development;

const db = knex(environment);

export default db;