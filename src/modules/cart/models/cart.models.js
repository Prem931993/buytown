import knex from '../../../config/db.js';

// Helper function to get or create user cart
async function getOrCreateUserCart(userId) {
  let cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (!cart) {
    const [newCart] = await knex('byt_carts')
      .insert({ user_id: userId, status: 'pending' })
      .returning('*');
    cart = newCart;
  }

  return cart;
}

// Add item to cart
export async function addToCart(userId, cartData) {
  const { product_id, variation_id, quantity } = cartData;

  // Validate product exists and is active
  const product = await knex('byt_products')
    .select('id', 'name', 'price', 'selling_price', 'stock', 'held_quantity', 'status')
    .where('id', product_id)
    .where('deleted_at', null)
    .where('status', 1) // 1 = active status (smallint)
    .first();

  if (!product) {
    throw new Error('Product not found or inactive');
  }

  let price, availableStock;
    // No variation selected
    price = product.selling_price || product.price;
    availableStock = product.stock - product.held_quantity;

  // Validate stock availability
  if (availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }

  // Get or create user cart
  const cart = await getOrCreateUserCart(userId);

  // Check if item already exists in cart
  const existingItem = await knex('byt_cart_items')
    .where('cart_id', cart.id)
    .where('product_id', product_id)
    .where('variation_id', variation_id)
    .first();

  if (existingItem) {
    // Update existing item quantity
    const newQuantity = existingItem.quantity + quantity;

    // Validate stock for new quantity
    if (availableStock < newQuantity) {
      throw new Error('Insufficient stock for requested quantity');
    }

    // Adjust held_quantity or stock
    await knex('byt_products')
      .where('id', product_id)
      .increment('held_quantity', quantity);


    return knex('byt_cart_items')
      .where('id', existingItem.id)
      .update({
        quantity: newQuantity,
        total_price: price * newQuantity,
        updated_at: knex.fn.now()
      })
      .returning('*');
  } else {
    // Add new item to cart
    // Adjust held_quantity or stock
    await knex('byt_products')
      .where('id', product_id)
      .increment('held_quantity', quantity);


    return knex('byt_cart_items')
      .insert({
        cart_id: cart.id,
        product_id,
        variation_id,
        quantity,
        price,
        total_price: price * quantity
      })
      .returning('*');
  }
}

// Get user's cart items
export async function getUserCartItems(userId) {
  // First get cart items with basic product info
  const cartItems = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .leftJoin('byt_products as p', 'ci.product_id', 'p.id')
    .leftJoin('byt_categories as cat', 'p.category_id', 'cat.id')
    .leftJoin('byt_brands as b', 'p.brand_id', 'b.id')
    .leftJoin('byt_product_variations as pv', 'ci.variation_id', 'pv.id')
    .leftJoin('byt_variations as v', 'pv.variation_id', 'v.id')
    .select(
      'ci.id as cart_item_id',
      'ci.quantity',
      'ci.price',
      'ci.total_price',
      'ci.created_at as added_at',
      'p.id as product_id',
      'p.name as product_name',
      'p.sku_code',
      'p.description',
      'p.stock as available_stock',
      'p.status as product_status',
      'p.gst as product_gst',
      'cat.name as category_name',
      'b.name as brand_name',
      'pv.id as variation_id',
      'pv.price as variation_price',
      'pv.stock as variation_stock',
      'v.label as variation_label',
      'v.value as variation_value'
    )
    .where('c.user_id', userId)
    .where('p.deleted_at', null)
    .orderBy('ci.created_at', 'desc');

  // Get product images separately
  const productIds = [...new Set(cartItems.map(item => item.product_id))];
  const productImages = await knex('byt_product_images')
    .select('product_id', 'id', 'image_path', 'sort_order', 'is_primary')
    .whereIn('product_id', productIds)
    .orderBy('product_id')
    .orderBy('sort_order');

  // Group images by product_id
  const imagesByProduct = {};
  productImages.forEach(img => {
    if (!imagesByProduct[img.product_id]) {
      imagesByProduct[img.product_id] = [];
    }
    imagesByProduct[img.product_id].push({
      id: img.id,
      path: img.image_path,
      sort_order: img.sort_order,
      is_primary: img.is_primary
    });
  });

  // Combine cart items with images and format variation data
  return cartItems.map(item => ({
    ...item,
    images: imagesByProduct[item.product_id] || [],
    variation: item.variation_id ? {
      id: item.variation_id,
      variation_label: item.variation_label,
      variation_value: item.variation_value,
      price: item.variation_price,
      stock: item.variation_stock
    } : null
  }));
}

// Update cart item quantity
export async function updateCartItem(userId, cartItemId, quantity) {
  // First check if cart item belongs to user and get product details
  const cartItem = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .leftJoin('byt_products as p', 'ci.product_id', 'p.id')
    .leftJoin('byt_product_variations as pv', 'ci.variation_id', 'pv.id')
    .select(
      'ci.*',
      'p.stock as product_stock',
      'p.held_quantity as product_held_quantity',
      'p.price as product_price',
      'p.selling_price as product_selling_price',
      'pv.stock as variation_stock',
      'pv.price as variation_price'
    )
    .where('ci.id', cartItemId)
    .where('c.user_id', userId)
    .where('p.deleted_at', null)
    .first();

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  // Check stock availability
  const availableStock = cartItem.variation_id ? cartItem.variation_stock : (cartItem.product_stock - cartItem.product_held_quantity);
  if (availableStock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Calculate quantity difference
  const quantityDifference = quantity - cartItem.quantity;

  // Adjust held_quantity or stock
  // For products, adjust held_quantity
  if (quantityDifference > 0) {
    await knex('byt_products')
      .where('id', cartItem.product_id)
      .increment('held_quantity', quantityDifference);
  } else if (quantityDifference < 0) {
    await knex('byt_products')
      .where('id', cartItem.product_id)
      .decrement('held_quantity', Math.abs(quantityDifference));
  }

  // Calculate new price
  const price = cartItem.variation_id ?
    (cartItem.variation_price || cartItem.product_selling_price || cartItem.product_price) :
    (cartItem.product_selling_price || cartItem.product_price);

  return knex('byt_cart_items')
    .where('id', cartItemId)
    .update({
      quantity,
      price,
      total_price: price * quantity,
      updated_at: knex.fn.now()
    })
    .returning('*');
}

// Remove cart item
export async function removeCartItem(userId, cartItemId) {
  // First verify the cart item belongs to the user and get details
  const cartItem = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .leftJoin('byt_products as p', 'ci.product_id', 'p.id')
    .select('ci.*', 'p.id as product_id')
    .where('ci.id', cartItemId)
    .where('c.user_id', userId)
    .first();

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  // Adjust held_quantity or stock before deleting
  await knex('byt_products')
    .where('id', cartItem.product_id)
    .decrement('held_quantity', cartItem.quantity);

  return knex('byt_cart_items')
    .where('id', cartItemId)
    .del();
}

// Get cart summary with detailed tax breakdown based on individual product GST rates
export async function getCartSummary(userId) {
  // Get cart items with product GST rates
  const cartItems = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .leftJoin('byt_products as p', 'ci.product_id', 'p.id')
    .select(
      'ci.quantity',
      'ci.total_price',
      'ci.price',
      'p.gst as product_gst',
      'p.name as product_name',
      'p.id as product_id'
    )
    .where('c.user_id', userId)
    .where('p.deleted_at', null);

  let subtotal = 0;
  let totalTax = 0;
  const itemTaxBreakdown = [];

  for (const item of cartItems) {
    const basePrice = parseFloat(item.price);
    const gstRate = parseFloat(item.product_gst) || 0; // Use product GST rate, default to 0 if not set
    const gstDecimal = gstRate / 100; // Convert percentage to decimal
    const itemTax = basePrice * gstDecimal * item.quantity;
    const itemPriceWithTax = basePrice * item.quantity + itemTax;

    subtotal += basePrice * item.quantity;
    totalTax += itemTax;

    // Add item tax breakdown
    itemTaxBreakdown.push({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: basePrice,
      total_price: itemPriceWithTax,
      gst_rate: gstRate,
      tax_amount: itemTax
    });
  }

  const totalAmount = subtotal + totalTax;

  return {
    total_items: cartItems.length,
    total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: subtotal,
    tax_amount: totalTax,
    total_amount: totalAmount,
    item_tax_breakdown: itemTaxBreakdown
  };
}

// Clear user's cart
export async function clearUserCart(userId) {
  // Get user's cart
  const cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (cart) {
    // Get all cart items to adjust held_quantity/stock
    const cartItems = await knex('byt_cart_items')
      .where('cart_id', cart.id)
      .select('product_id', 'variation_id', 'quantity');

    // Adjust held_quantity or stock for each item
    for (const item of cartItems) {
        await knex('byt_products')
          .where('id', item.product_id)
          .decrement('held_quantity', item.quantity);
    }

    // Delete all cart items
    await knex('byt_cart_items')
      .where('cart_id', cart.id)
      .del();

    // Update cart status to empty
    await knex('byt_carts')
      .where('id', cart.id)
      .update({
        status: 'empty',
        updated_at: knex.fn.now()
      });
  }

  return true;
}

// Update cart status
export async function updateCartStatus(userId, status) {
  const validStatuses = ['pending', 'processing', 'completed', 'empty', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new Error('Invalid cart status');
  }

  const result = await knex('byt_carts')
    .where('user_id', userId)
    .update({
      status,
      updated_at: knex.fn.now()
    })
    .returning('*');

  return result;
}

// Get cart status
export async function getCartStatus(userId) {
  const cart = await knex('byt_carts')
    .select('status', 'updated_at')
    .where('user_id', userId)
    .first();

  return cart || { status: 'empty', updated_at: null };
}

// Mark cart as processing (when moving to checkout)
export async function markCartAsProcessing(userId) {
  return updateCartStatus(userId, 'processing');
}

// Mark cart as completed (when order is placed)
export async function markCartAsCompleted(userId) {
  return updateCartStatus(userId, 'completed');
}

// Clear cart items without releasing held quantities (used when order is placed)
export async function clearCartItemsOnly(userId) {
  // Get user's cart
  const cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (cart) {
    // Delete all cart items without adjusting stock/held quantities
    await knex('byt_cart_items')
      .where('cart_id', cart.id)
      .del();

    // Update cart status to completed
    await knex('byt_carts')
      .where('id', cart.id)
      .update({
        status: 'completed',
        updated_at: knex.fn.now()
      });
  }

  return true;
}

// Release held quantities when order is placed (only for products, variations already adjusted)
export async function releaseHeldQuantitiesForOrder(userId) {
  // Get user's cart
  const cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (cart) {
    // Get all cart items to release held_quantity for products
    const cartItems = await knex('byt_cart_items')
      .where('cart_id', cart.id)
      .select('product_id', 'variation_id', 'quantity');

    // Adjust held_quantity for products (decrease since sold)
    for (const item of cartItems) {
      if (!item.variation_id) {
        await knex('byt_products')
          .where('id', item.product_id)
          .decrement('held_quantity', item.quantity);
      }
      // For variations, stock was already decreased when added to cart, so no change needed
    }

    // Delete all cart items
    await knex('byt_cart_items')
      .where('cart_id', cart.id)
      .del();

    // Update cart status to completed
    await knex('byt_carts')
      .where('id', cart.id)
      .update({
        status: 'completed',
        updated_at: knex.fn.now()
      });
  }

  return true;
}
