import * as roleModel from '../models/role.models.js';

export const getAllRoles = async () => {
  const roles = await roleModel.getAllRoles();
  return roles;
};
