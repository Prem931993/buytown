import * as userModel from '../models/user.models.js';
import * as roleModel from '../models/role.models.js';
import { hash, compare } from 'bcryptjs';

// Cache roles to avoid repeated database calls
let rolesCache = null;
let rolesCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getRoles = async () => {
    const now = Date.now();
    if (!rolesCache || !rolesCacheTimestamp || (now - rolesCacheTimestamp) > CACHE_DURATION) {
        rolesCache = await roleModel.getAllRoles();
        rolesCacheTimestamp = now;
    }
    return rolesCache;
};

const getRoleString = async (roleId) => {
    const roles = await getRoles();
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'user'; // Default to 'user' if role_id not found
};

export const getAllUsers = async () => {
    const users = await userModel.getAllUsers();

    // Transform the data to match frontend expectations
    const transformedUsers = await Promise.all(users.map(async user => ({
        ...user,
        // Convert role_id to role string
        role: await getRoleString(user.role_id),
        // Convert smallint status to string
        status: user.status === 1 ? 'active' : user.status === 2 ? 'inactive' : user.status === 3 ? 'suspended' : 'active'
    })));

    return transformedUsers;
};

export const getUserById = async (id) => {
    const user = await userModel.getUserById(id);

    if (!user) return null;

    // Transform the data to match frontend expectations
    return {
        ...user,
        // Convert role_id to role string
        role: await getRoleString(user.role_id),
        // Convert smallint status to string
        status: user.status === 1 ? 'active' : user.status === 2 ? 'inactive' : user.status === 3 ? 'suspended' : 'active'
    };
};

export const createUser = async (userData) => {
    // Ensure userData is a valid object
    if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided');
    }

    // Determine role_id from either role_id field or role string
    let role_id = userData.role_id;
    if (!role_id && userData.role) {
        const roles = await getRoles();
        const role = roles.find(r => r.name === userData.role);
        role_id = role ? role.id : 2; // Default to user role (2)
    }
    if (!role_id) {
        role_id = 2; // Default to user role if nothing provided
    }

    // Process the data to ensure all required fields are present
    let processedStatus = userData.status !== undefined && userData.status !== null ? userData.status : 'active';

    // Convert status to smallint if needed
    if (typeof processedStatus === 'string') {
        // Check if it's already a numeric string (like "2")
        const numericValue = parseInt(processedStatus, 10);
        if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 3) {
            processedStatus = numericValue;
        } else {
            // Handle string status values
            const statusStr = processedStatus.toLowerCase();
            if (statusStr === 'active' || statusStr === 'true') {
                processedStatus = 1;
            } else if (statusStr === 'inactive' || statusStr === 'false') {
                processedStatus = 2;
            } else if (statusStr === 'suspended') {
                processedStatus = 3;
            } else {
                processedStatus = 1; // default to active
            }
        }
    } else if (typeof processedStatus === 'number') {
        // Ensure it's within valid range
        if (processedStatus < 1 || processedStatus > 3) {
            processedStatus = 1; // default to active
        }
    } else {
        // Default to active for any other type
        processedStatus = 1;
    }

    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
        hashedPassword = await hash(userData.password, 10);
    }

    const processedData = {
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || null,
        phone_no: userData.phone_no || null,
        password: hashedPassword,
        gstin: userData.gstin || null,
        address: userData.address || null,
        role_id: role_id,
        status: processedStatus,
        profile_photo: userData.profile_photo || null,
        license: userData.license || null,
        username: userData.username || null,
        vehicle_number: userData.vehicle_number || null
    };

    const userId = await userModel.createUser(processedData);

    // Handle vehicle assignments if provided
    if (userData.vehicle_ids && Array.isArray(userData.vehicle_ids) && userData.vehicle_ids.length > 0) {
        await userModel.assignVehiclesToUser(userId, userData.vehicle_ids);
    }

    // Get the created user and transform the response
    const createdUser = await userModel.getUserById(userId);

    if (!createdUser) return userId;

    // Transform the response data to match frontend expectations
    return {
        ...createdUser,
        // Convert role_id to role string
        role: await getRoleString(createdUser.role_id),
        // Convert smallint status to string
        status: createdUser.status === 1 ? 'active' : createdUser.status === 2 ? 'inactive' : createdUser.status === 3 ? 'suspended' : 'active'
    };
};

export const updateUser = async (id, userData) => {
    // Transform incoming data if needed
    let processedData = { ...userData };

    // If role string is provided, convert to role_id
    if (processedData.role && !processedData.role_id) {
        const roles = await getRoles();
        const role = roles.find(r => r.name === processedData.role);
        processedData.role_id = role ? role.id : 2; // Default to user role (2)
        delete processedData.role; // Remove role string after conversion
    }

    // If status is provided, ensure it's in the correct smallint format
    if (processedData.status !== undefined && processedData.status !== null) {
        // Handle both string and number inputs
        if (typeof processedData.status === 'string') {
            // Check if it's already a numeric string (like "2")
            const numericValue = parseInt(processedData.status, 10);
            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 3) {
                processedData.status = numericValue;
            } else {
                // Handle string status values
                const statusStr = processedData.status.toLowerCase();
                if (statusStr === 'active' || statusStr === 'true') {
                    processedData.status = 1;
                } else if (statusStr === 'inactive' || statusStr === 'false') {
                    processedData.status = 2;
                } else if (statusStr === 'suspended') {
                    processedData.status = 3;
                } else {
                    processedData.status = 1; // default to active
                }
            }
        } else if (typeof processedData.status === 'number') {
            // Ensure it's within valid range
            if (processedData.status < 1 || processedData.status > 3) {
                processedData.status = 1; // default to active
            }
        } else {
            // Default to active for any other type
            processedData.status = 1;
        }
    }

    // If password is provided, hash it
    if (processedData.password) {
        processedData.password = await hash(processedData.password, 10);
    }

    // Handle vehicle assignments separately
    if (processedData.vehicle_ids !== undefined) {
        const vehicleIds = processedData.vehicle_ids;
        delete processedData.vehicle_ids; // Remove from processedData to avoid passing to updateUser

        // Update vehicle assignments
        if (Array.isArray(vehicleIds)) {
            await userModel.assignVehiclesToUser(id, vehicleIds, processedData.vehicle_numbers);
        }
    }

    // Handle vehicle_numbers separately if vehicle_ids not provided
    if (processedData.vehicle_numbers !== undefined && processedData.vehicle_ids === undefined) {
        const vehicleNumbers = processedData.vehicle_numbers;
        delete processedData.vehicle_numbers; // Remove from processedData

        // Update vehicle numbers for existing assignments
        if (typeof vehicleNumbers === 'object') {
            await userModel.updateVehicleNumbers(id, vehicleNumbers);
        }
    }

    const updatedUser = await userModel.updateUser(id, processedData);

    if (!updatedUser) return null;

    // Transform the response data to match frontend expectations
    return {
        ...updatedUser,
        // Convert role_id to role string
        role: await getRoleString(updatedUser.role_id),
        // Convert smallint status to string
        status: updatedUser.status === 1 ? 'active' : updatedUser.status === 2 ? 'inactive' : updatedUser.status === 3 ? 'suspended' : 'active'
    };
};

export const deleteUser = async (id) => {
    return await userModel.deleteUser(id);
};

// Add more user-related service functions as needed
