import db from '../../../config/db.js';

export const getAllUsers = async () => {
    const [rows] = await db.execute('SELECT * FROM byt_users');
    return rows;
};

export const getUserById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM byt_users WHERE id = ?', [id]);
    return rows[0];
};

export const createUser = async (userData) => {
    const { username, email, phone_no, password, gstin, address, role_id, status } = userData;
    const [result] = await db.execute(
        'INSERT INTO byt_users (username, email, phone_no, password, gstin, address, role_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [username, email, phone_no, password, gstin, address, role_id, status]
    );
    return result.insertId;
};

// Add more user-related database operations as needed
