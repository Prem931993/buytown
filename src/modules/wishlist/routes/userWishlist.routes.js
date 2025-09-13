import { Router } from 'express';
import * as userWishlistController from '../controllers/userWishlist.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// Add item to wishlist
router.post('/add', verifyUserDualAuth, userWishlistController.addToWishlist);

// Get user wishlist items
router.get('/', verifyUserDualAuth, userWishlistController.getWishlistItems);

// Remove item from wishlist
router.delete('/remove', verifyUserDualAuth, userWishlistController.removeWishlistItem);

// Move wishlist item to cart
router.post('/move-to-cart', verifyUserDualAuth, userWishlistController.moveWishlistItemToCart);

export default router;
