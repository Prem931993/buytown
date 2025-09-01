import * as userModel from '../models/user.models.js';

export const getAllUsers = async () => {
    const users = await userModel.getAllUsers();

    // Transform the data to match frontend expectations
    return users.map(user => ({
        ...user,
        // Convert role_id to role string
        role: getRoleString(user.role_id),
        // Convert boolean status to string
        status: user.status ? 'active' : 'inactive'
    }));
};

export const getUserById = async (id) => {
    const user = await userModel.getUserById(id);

    if (!user) return null;

    // Transform the data to match frontend expectations
    return {
        ...user,
        // Convert role_id to role string
        role: getRoleString(user.role_id),
        // Convert boolean status to string
        status: user.status ? 'active' : 'inactive'
    };
};

// Helper function to convert role_id to role string
const getRoleString = (roleId) => {
    const roleMapping = {
        1: 'admin',
        2: 'user',
        3: 'delivery_person'
    };
    return roleMapping[roleId] || 'user'; // Default to 'user' if role_id not found
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

    const userId = await userModel.createUser(processedData);

    // Get the created user and transform the response
    const createdUser = await userModel.getUserById(userId);

    if (!createdUser) return userId;

    // Transform the response data to match frontend expectations
    return {
        ...createdUser,
        // Convert role_id to role string
        role: getRoleString(createdUser.role_id),
        // Convert boolean status to string
        status: createdUser.status ? 'active' : 'inactive'
    };
};

export const updateUser = async (id, userData) => {
    // Transform incoming data if needed
    let processedData = { ...userData };

    // If role string is provided, convert to role_id
    if (processedData.role && !processedData.role_id) {
        const roleMapping = {
            'admin': 1,
            'user': 2,
            'delivery_person': 3
        };
        processedData.role_id = roleMapping[processedData.role];
        delete processedData.role; // Remove role string after conversion
    }

    // If status string is provided, convert to boolean
    if (typeof processedData.status === 'string') {
        processedData.status = processedData.status === 'active';
    }

    const updatedUser = await userModel.updateUser(id, processedData);

    if (!updatedUser) return null;

    // Transform the response data to match frontend expectations
    return {
        ...updatedUser,
        // Convert role_id to role string
        role: getRoleString(updatedUser.role_id),
        // Convert boolean status to string
        status: updatedUser.status ? 'active' : 'inactive'
    };
};

export const deleteUser = async (id) => {
    return await userModel.deleteUser(id);
};

// Add more user-related service functions as needed
