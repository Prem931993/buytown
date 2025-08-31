import db from '../../../config/db.js';

export const getAllUsers = async () => {
    return await db('byt_users').select('*');
};

export const getUserById = async (id) => {
    return await db('byt_users').where({ id }).first();
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
        status: status === 'active', // Convert string to boolean
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

    const [result] = await db('byt_users').where({ id }).update(updateData).returning('*');
    return result;
};

export const deleteUser = async (id) => {
    return await db('byt_users').where({ id }).del();
};

// Add more user-related database operations as needed
