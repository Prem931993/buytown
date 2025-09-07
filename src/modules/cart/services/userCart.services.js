import * as cartModels from '../models/cart.models.js';

export async function addToCartService(userId, cartData) {
  try {
    const [cartItem] = await cartModels.addToCart(userId, cartData);
    return { cart_item: cartItem, message: 'Item added to cart', status: 200 };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
}

export async function getCartItemsService(userId) {
  try {
    const cartItems = await cartModels.getUserCartItems(userId);
    const summary = await cartModels.getCartSummary(userId);
    return { cart_items: cartItems, summary, status: 200 };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
}

export async function updateCartItemService(userId, updateData) {
  try {
    const [cartItem] = await cartModels.updateCartItem(userId, updateData.cart_item_id, updateData.quantity);
    return { cart_item: cartItem, message: 'Cart item updated', status: 200 };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
}

export async function removeCartItemService(userId, cartItemId) {
  try {
    await cartModels.removeCartItem(userId, cartItemId);
    return { message: 'Cart item removed', status: 200 };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
}

export async function clearCartService(userId) {
  try {
    await cartModels.clearUserCart(userId);
    return { message: 'Cart cleared successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
}
