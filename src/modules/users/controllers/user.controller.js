import * as userService from '../services/user.services.js';
import { validateUser } from '../validators/user.validators.js';
import { validationResult } from 'express-validator';

export const getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    // Validate the request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = await userService.createUser(req.body);
        res.status(201).json({ id: userId, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add more user-related functions as needed
