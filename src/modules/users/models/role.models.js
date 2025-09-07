import db from '../../../config/db.js';

export const getAllRoles = async () => {
  const roles = await db('byt_roles').select('id', 'name');
  return roles;
};
