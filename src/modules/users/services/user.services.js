import * as userModel from '../models/user.models.js';

export const getAllUsers = async () => {
    return await userModel.getAllUsers();
};

export const createUser = async (userData) => {
    return await userModel.createUser(userData);
};

// Add more user-related service functions as needed
