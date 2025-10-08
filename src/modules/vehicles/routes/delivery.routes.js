import express from 'express';
const router = express.Router();
import * as deliveryController from '../controllers/delivery.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

router.get('/', verifyDualAuth, deliveryController.getAllDeliverySettings);
router.get('/single', verifyDualAuth, deliveryController.getDeliverySettings);
router.post('/', verifyDualAuth, deliveryController.createDeliverySetting);
router.put('/:id', verifyDualAuth, deliveryController.updateDeliverySetting);
router.delete('/:id', verifyDualAuth, deliveryController.deleteDeliverySetting);
router.put('/', verifyDualAuth, deliveryController.updateDeliverySettings);

export default router;
