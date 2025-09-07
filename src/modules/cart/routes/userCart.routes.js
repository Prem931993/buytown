import { Router } from 'express';
import * as userCartController from '../controllers/userCart.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// Add item to cart
router.post('/add', verifyUserDualAuth, userCartController.addToCart);

// Get user cart items
router.get('/', verifyUserDualAuth, userCartController.getCartItems);

// Update cart item quantity
router.put('/update', verifyUserDualAuth, userCartController.updateCartItem);

// Remove item from cart
router.delete('/remove', verifyUserDualAuth, userCartController.removeCartItem);

// Clear entire cart
router.delete('/clear', verifyUserDualAuth, userCartController.clearCart);

export default router;
