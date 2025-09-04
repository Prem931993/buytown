import express from 'express';
const router = express.Router();
import * as vehicleController from '../controllers/vehicle.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

router.get('/', verifyDualAuth, vehicleController.getVehicles);
router.get('/:id', verifyDualAuth, vehicleController.getVehicle);
router.post('/', verifyDualAuth, vehicleController.createVehicle);
router.put('/:id', verifyDualAuth, vehicleController.updateVehicle);
router.delete('/:id', verifyDualAuth, vehicleController.deleteVehicle);

export default router;
