import express from 'express';
const router = express.Router();
import * as deliveryController from '../controllers/delivery.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

router.get('/', verifyDualAuth, deliveryController.getDeliverySettings);
router.put('/', verifyDualAuth, deliveryController.updateDeliverySettings);

export default router;
