import * as userModel from '../models/user.models.js';

export const getAllUsers = async () => {
    return await userModel.getAllUsers();
};

export const getUserById = async (id) => {
    return await userModel.getUserById(id);
};

export const createUser = async (userData) => {
    // Ensure userData is a valid object
    if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided');
    }

    // Map role string to role_id (same mapping as auth service)
    const roleMapping = {
        'admin': 1,
        'user': 2,
        'delivery_person': 3
    };

    // Determine role_id from either role_id field or role string
    let role_id = userData.role_id;
    if (!role_id && userData.role) {
        role_id = roleMapping[userData.role] || 2; // Default to user role (2)
    }
    if (!role_id) {
        role_id = 2; // Default to user role if nothing provided
    }

    // Process the data to ensure all required fields are present
    const processedData = {
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || null,
        phone_no: userData.phone_no || null,
        password: userData.password || null,
        gstin: userData.gstin || null,
        address: userData.address || null,
        role_id: role_id,
        status: userData.status || 'active',
        profile_photo: userData.profile_photo || null,
        license: userData.license || null,
        username: userData.username || null
    };

    return await userModel.createUser(processedData);
};

export const updateUser = async (id, userData) => {
    return await userModel.updateUser(id, userData);
};

export const deleteUser = async (id) => {
    return await userModel.deleteUser(id);
};

// Add more user-related service functions as needed
