import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { getRoles } from '../controllers/role.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';
import { uploadUserFiles } from '../middleware/userUploadMiddleware.js';

const router = express.Router();

// Define user-related routes with admin middleware
// More specific routes must come before parameterized routes
router.get('/roles', verifyDualAuth, getRoles);
router.get('/', verifyDualAuth, getUsers);
router.get('/:id', verifyDualAuth, getUser);
router.post('/', verifyDualAuth, uploadUserFiles, createUser);
router.put('/:id', verifyDualAuth, uploadUserFiles, updateUser);
router.delete('/:id', verifyDualAuth, deleteUser);

export default router;
