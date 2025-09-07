import db from '../../../config/db.js';

export const getAllUsers = async () => {
    const users = await db('byt_users').select('*');

    // Get vehicle assignments for all users
    const userIds = users.map(user => user.id);
    if (userIds.length > 0) {
        const vehicleAssignments = await db('byt_user_vehicle')
            .join('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
            .whereIn('byt_user_vehicle.user_id', userIds)
            .select('byt_user_vehicle.user_id', 'byt_vehicle_management.*');

        // Group vehicles by user_id
        const vehiclesByUser = {};
        vehicleAssignments.forEach(assignment => {
            if (!vehiclesByUser[assignment.user_id]) {
                vehiclesByUser[assignment.user_id] = [];
            }
            vehiclesByUser[assignment.user_id].push(assignment);
        });

        // Add vehicles to each user
        users.forEach(user => {
            user.vehicles = vehiclesByUser[user.id] || [];
        });
    }

    return users;
};

export const getUserById = async (id) => {
    const user = await db('byt_users').where({ id }).first();

    if (!user) return null;

    // Get assigned vehicles for the user
    const vehicles = await db('byt_user_vehicle')
        .join('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
        .where('byt_user_vehicle.user_id', id)
        .select('byt_vehicle_management.*');

    return {
        ...user,
        vehicles: vehicles || []
    };
};

export const createUser = async (userData) => {
    // Data should now be properly processed by the service layer
    // Extract fields with proper defaults
    let {
        firstname = '',
        lastname = '',
        username,
        email,
        phone_no,
        password,
        gstin,
        address,
        role_id,
        status = 'active',
        profile_photo,
        license
    } = userData;

    // Convert empty strings to null for optional fields
    firstname = firstname && firstname.trim() !== '' ? firstname.trim() : '';
    lastname = lastname && lastname.trim() !== '' ? lastname.trim() : '';
    email = email && email.trim() !== '' ? email.trim() : null;
    phone_no = phone_no && phone_no.trim() !== '' ? phone_no.trim() : null;
    password = password && password.trim() !== '' ? password.trim() : null;
    gstin = gstin && gstin.trim() !== '' ? gstin.trim() : null;
    address = address && address.trim() !== '' ? address.trim() : null;

    // Convert status string to smallint if needed
    if (typeof status === 'string') {
        if (status.toLowerCase() === 'active') {
            status = 1;
        } else if (status.toLowerCase() === 'inactive') {
            status = 2;
        } else if (status.toLowerCase() === 'suspended') {
            status = 3;
        } else {
            status = 1; // default to active
        }
    }

    // If username is provided but firstname/lastname are not, split username
    if (username && username.trim() !== '' && (!firstname || firstname === '') && (!lastname || lastname === '')) {
        const nameParts = username.trim().split(' ');
        firstname = nameParts[0] || '';
        lastname = nameParts.slice(1).join(' ') || '';
    }

    // Ensure firstname and lastname are provided (default to empty strings)
    if (!firstname || firstname === '') firstname = '';
    if (!lastname || lastname === '') lastname = '';

    const [result] = await db('byt_users').insert({
        firstname,
        lastname,
        email,
        phone_no,
        password,
        gstin,
        address,
        role_id: parseInt(role_id, 10), // Ensure role_id is a number
        status: status, // status is already converted to boolean above
        profile_photo,
        license
    }).returning('id');
    return result.id || result;
};

export const updateUser = async (id, userData) => {
    // Handle both old username format and new firstname/lastname format for updates
    let updateData = { ...userData };

    // Convert empty strings to undefined for optional fields to avoid updating with empty values
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || (typeof updateData[key] === 'string' && updateData[key].trim() === '')) {
            delete updateData[key];
        }
    });

    // If username is provided but firstname/lastname are not, split username
    if (updateData.username && !updateData.firstname && !updateData.lastname) {
        const nameParts = updateData.username.trim().split(' ');
        updateData.firstname = nameParts[0] || '';
        updateData.lastname = nameParts.slice(1).join(' ') || '';
        delete updateData.username; // Remove username from update data
    }

    // Convert status string to smallint if provided
    if (typeof updateData.status === 'string') {
        if (updateData.status.toLowerCase() === 'active') {
            updateData.status = 1;
        } else if (updateData.status.toLowerCase() === 'inactive') {
            updateData.status = 2;
        } else if (updateData.status.toLowerCase() === 'suspended') {
            updateData.status = 3;
        } else {
            updateData.status = 1; // default to active
        }
    }

    const [result] = await db('byt_users').where({ id }).update(updateData).returning('*');
    return result;
};

export const deleteUser = async (id) => {
    return await db('byt_users').where({ id }).del();
};

// Add more user-related database operations as needed

export const assignVehiclesToUser = async (userId, vehicleIds) => {
    if (!userId || !Array.isArray(vehicleIds)) {
        throw new Error('Invalid parameters for assigning vehicles to user');
    }

    // First, delete existing vehicle assignments for the user
    await db('byt_user_vehicle').where({ user_id: userId }).del();

    // Insert new vehicle assignments
    const insertData = vehicleIds.map(vehicleId => ({
        user_id: userId,
        vehicle_id: vehicleId
    }));

    if (insertData.length > 0) {
        await db('byt_user_vehicle').insert(insertData);
    }
};
