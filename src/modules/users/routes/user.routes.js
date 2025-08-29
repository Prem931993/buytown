import express from 'express';
import { getUsers, createUser } from '../controllers/user.controller.js';

const router = express.Router();

// Define user-related routes
router.get('/', getUsers);
router.post('/', createUser);

// Add more user-related routes as needed

export default router;
