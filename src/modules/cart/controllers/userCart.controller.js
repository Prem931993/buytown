import * as services from '../services/userCart.services.js';

export async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, variation_id, quantity } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Product ID and quantity are required'
      });
    }

    const result = await services.addToCartService(userId, {
      product_id: parseInt(product_id),
      variation_id: variation_id ? parseInt(variation_id) : null,
      quantity: parseInt(quantity)
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      cart_item: result.cart_item
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getCartItems(req, res) {
  try {
    const userId = req.user.id;

    const result = await services.getCartItemsService(userId);

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      cart_items: result.cart_items,
      summary: result.summary
    });
  } catch (error) {
    console.error('Error in getCartItems:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { cart_item_id, quantity } = req.body;

    if (!cart_item_id || !quantity) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Cart item ID and quantity are required'
      });
    }

    const result = await services.updateCartItemService(userId, {
      cart_item_id: parseInt(cart_item_id),
      quantity: parseInt(quantity)
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      cart_item: result.cart_item
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function removeCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { cart_item_id } = req.body;

    if (!cart_item_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Cart item ID is required'
      });
    }

    const result = await services.removeCartItemService(userId, parseInt(cart_item_id));

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message
    });
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user.id;

    const result = await services.clearCartService(userId);

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
