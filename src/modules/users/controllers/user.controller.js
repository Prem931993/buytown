import * as userService from '../services/user.services.js';
import { validateUser } from '../validators/user.validators.js';
import { validationResult } from 'express-validator';
import { processUserFiles } from '../middleware/userUploadMiddleware.js';

export const getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
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
        // Ensure we have a proper object to pass to the service
        // Handle both JSON and form data
        let userData = req.body && typeof req.body === 'object' ? req.body : {};

        // Process files if present (upload to Cloudinary or handle local storage)
        await processUserFiles(req);

        // Handle vehicle_ids from FormData (array format)
        if (req.body && req.body['vehicle_ids[]']) {
            const vehicleIds = Array.isArray(req.body['vehicle_ids[]'])
                ? req.body['vehicle_ids[]']
                : [req.body['vehicle_ids[]']];
            userData.vehicle_ids = vehicleIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        }

        // Handle vehicle_numbers from FormData (object format)
        if (req.body) {
            const vehicleNumbers = {};
            Object.keys(req.body).forEach(key => {
                if (key.startsWith('vehicle_numbers[') && key.endsWith(']')) {
                    const vehicleId = key.match(/vehicle_numbers\[(\d+)\]/)[1];
                    vehicleNumbers[vehicleId] = req.body[key];
                }
            });
            if (Object.keys(vehicleNumbers).length > 0) {
                userData.vehicle_numbers = vehicleNumbers;
            }
        }

        // Handle vehicle_numbers from FormData (object format)
        if (req.body) {
            const vehicleNumbers = {};
            Object.keys(req.body).forEach(key => {
                if (key.startsWith('vehicle_numbers[') && key.endsWith(']')) {
                    const vehicleId = key.match(/vehicle_numbers\[(\d+)\]/)[1];
                    vehicleNumbers[vehicleId] = req.body[key];
                }
            });
            if (Object.keys(vehicleNumbers).length > 0) {
                userData.vehicle_numbers = vehicleNumbers;
            }
        }

        const userId = await userService.createUser(userData);
        res.status(201).json({ id: userId, message: 'User created successfully' });
    } catch (error) {
        console.error('[USER_CONTROLLER] createUser error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        // Handle both JSON and multipart form data
        let userData = req.body;

        // Process files if present (upload to Cloudinary or handle local storage)
        await processUserFiles(req);

        // Handle vehicle_ids from FormData (array format)
        if (req.body && req.body['vehicle_ids[]']) {
            const vehicleIds = Array.isArray(req.body['vehicle_ids[]'])
                ? req.body['vehicle_ids[]']
                : [req.body['vehicle_ids[]']];
            userData.vehicle_ids = vehicleIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        }

        const user = await userService.updateUser(req.params.id, userData);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ user, message: 'User updated successfully' });
    } catch (error) {
        console.error('[USER_CONTROLLER] updateUser error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const deleted = await userService.deleteUser(req.params.id);
        if (deleted === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add more user-related functions as needed
