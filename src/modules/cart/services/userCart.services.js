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

    // Map tax details from summary to cart items
    const taxMap = {};
    if (summary && summary.item_tax_breakdown) {
      for (const itemTax of summary.item_tax_breakdown) {
        taxMap[itemTax.product_id] = {
          gst_rate: itemTax.gst_rate,
          tax_amount: itemTax.tax_amount
        };
      }
    }

    // Add tax details to each cart item and recalculate total_price to include tax
    const cartItemsWithTax = cartItems.map(item => {
      const taxDetails = taxMap[item.product_id] || { gst_rate: 0, tax_amount: 0 };
      const basePrice = parseFloat(item.price);
      const gstRate = taxDetails.gst_rate;
      const gstDecimal = gstRate / 100;
      const taxAmount = basePrice * gstDecimal * item.quantity;
      const totalPriceWithTax = basePrice * item.quantity + taxAmount;

      return {
        ...item,
        gst_rate: gstRate,
        tax_amount: taxAmount,
        total_price: totalPriceWithTax
      };
    });

    // Remove item_tax_breakdown from summary to avoid redundancy
    const { item_tax_breakdown, tax_rate, ...summaryWithoutTaxBreakdown } = summary;

    return { cart_items: cartItemsWithTax, summary: summaryWithoutTaxBreakdown, status: 200 };
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
