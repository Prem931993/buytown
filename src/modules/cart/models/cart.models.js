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
    .select('id', 'name', 'price', 'selling_price', 'stock', 'status')
    .where('id', product_id)
    .where('deleted_at', null)
    .where('status', 1) // 1 = active status (smallint)
    .first();

  if (!product) {
    throw new Error('Product not found or inactive');
  }

  let price, stock;

  if (variation_id) {
    // If variation is selected, get variation details
    const variation = await knex('byt_product_variations')
      .select('price', 'stock')
      .where('id', variation_id)
      .where('product_id', product_id)
      .first();

    if (!variation) {
      throw new Error('Variation not found');
    }

    // Use variation price if available, otherwise use product price
    price = variation.price || product.selling_price || product.price;
    stock = variation.stock;
  } else {
    // No variation selected
    price = product.selling_price || product.price;
    stock = product.stock;
  }

  // Validate stock availability
  if (stock < quantity) {
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
    if (stock < newQuantity) {
      throw new Error('Insufficient stock for requested quantity');
    }

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
  const availableStock = cartItem.variation_id ? cartItem.variation_stock : cartItem.product_stock;
  if (availableStock < quantity) {
    throw new Error('Insufficient stock');
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
  // First verify the cart item belongs to the user
  const cartItem = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .where('ci.id', cartItemId)
    .where('c.user_id', userId)
    .first();

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  return knex('byt_cart_items')
    .where('id', cartItemId)
    .del();
}

// Get cart summary with detailed tax breakdown based on active tax configuration
export async function getCartSummary(userId) {
  // Get active tax rate from tax configurations
  const taxConfig = await knex('byt_tax_configurations')
    .select('tax_rate')
    .where('is_active', true)
    .first();

  const taxRate = taxConfig ? parseFloat(taxConfig.tax_rate) / 100 : 0; // Convert percentage to decimal

  // Get cart items
  const cartItems = await knex('byt_cart_items as ci')
    .leftJoin('byt_carts as c', 'ci.cart_id', 'c.id')
    .select(
      'ci.quantity',
      'ci.total_price'
    )
    .where('c.user_id', userId);

  let subtotal = 0;
  let totalTax = 0;

  for (const item of cartItems) {
    subtotal += parseFloat(item.total_price);
    const itemTax = parseFloat(item.total_price) * taxRate;
    totalTax += itemTax;
  }

  const totalAmount = subtotal + totalTax;

  return {
    total_items: cartItems.length,
    total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: subtotal,
    tax_amount: totalTax,
    total_amount: totalAmount,
    tax_rate: taxRate * 100 // Return as percentage for display
  };
}

// Clear user's cart
export async function clearUserCart(userId) {
  // Get user's cart
  const cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (cart) {
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
