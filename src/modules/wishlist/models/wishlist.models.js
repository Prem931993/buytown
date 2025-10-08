import knex from '../../../config/db.js';

// Add item to wishlist
export async function addToWishlist(userId, wishlistData) {
  const { product_id, variation_id } = wishlistData;

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

  // Check if item already exists in wishlist
  const existingItem = await knex('byt_wishlist_items')
    .where('user_id', userId)
    .where('product_id', product_id)
    .where('variation_id', variation_id)
    .first();

  if (existingItem) {
    throw new Error('Item already exists in wishlist');
  }

  // Add new item to wishlist
  return knex('byt_wishlist_items')
    .insert({
      user_id: userId,
      product_id,
      variation_id
    })
    .returning('*');
}

// Get user's wishlist items
export async function getUserWishlistItems(userId, { page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;

  // Get total count for pagination
  const totalCount = await knex('byt_wishlist_items as wi')
    .leftJoin('byt_products as p', 'wi.product_id', 'p.id')
    .where('wi.user_id', userId)
    .where('p.deleted_at', null)
    .count('wi.id as count')
    .first();

  // Get wishlist items with product details
  const wishlistItems = await knex('byt_wishlist_items as wi')
    .leftJoin('byt_products as p', 'wi.product_id', 'p.id')
    .leftJoin('byt_categories as cat', 'p.category_id', 'cat.id')
    .leftJoin('byt_brands as b', 'p.brand_id', 'b.id')
    .leftJoin('byt_product_variations as pv', 'wi.variation_id', 'pv.id')
    .leftJoin('byt_variations as v', 'pv.variation_id', 'v.id')
    .select(
      'wi.id as wishlist_item_id',
      'wi.created_at as added_at',
      'p.id as product_id',
      'p.name as product_name',
      'p.sku_code',
      'p.description',
      'p.price',
      'p.selling_price',
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
    .where('wi.user_id', userId)
    .where('p.deleted_at', null)
    .orderBy('wi.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // Get product images separately
  const productIds = [...new Set(wishlistItems.map(item => item.product_id))];
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

  // Combine wishlist items with images and format variation data
  const formattedItems = wishlistItems.map(item => ({
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

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount.count / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    items: formattedItems,
    pagination: {
      current_page: page,
      per_page: limit,
      total_count: totalCount.count,
      total_pages: totalPages,
      has_next_page: hasNextPage,
      has_prev_page: hasPrevPage
    }
  };
}

// Remove wishlist item
export async function removeWishlistItem(userId, wishlistItemId) {
  // First verify the wishlist item belongs to the user
  const wishlistItem = await knex('byt_wishlist_items')
    .where('id', wishlistItemId)
    .where('user_id', userId)
    .first();

  if (!wishlistItem) {
    throw new Error('Wishlist item not found');
  }

  return knex('byt_wishlist_items')
    .where('id', wishlistItemId)
    .del();
}

// Move wishlist item to cart
export async function moveWishlistItemToCart(userId, wishlistItemId) {
  // Get wishlist item details
  const wishlistItem = await knex('byt_wishlist_items as wi')
    .leftJoin('byt_products as p', 'wi.product_id', 'p.id')
    .select(
      'wi.*',
      'p.name as product_name',
      'p.price',
      'p.selling_price',
      'p.stock',
      'p.status'
    )
    .where('wi.id', wishlistItemId)
    .where('wi.user_id', userId)
    .where('p.deleted_at', null)
    .first();

  if (!wishlistItem) {
    throw new Error('Wishlist item not found');
  }

  // Check if product is still available
  if (wishlistItem.status !== 1) {
    throw new Error('Product is no longer available');
  }

  // Get or create user cart
  let cart = await knex('byt_carts')
    .where('user_id', userId)
    .first();

  if (!cart) {
    const [newCart] = await knex('byt_carts')
      .insert({ user_id: userId, status: 'pending' })
      .returning('*');
    cart = newCart;
  }

  // Check if item already exists in cart
  const existingCartItem = await knex('byt_cart_items')
    .where('cart_id', cart.id)
    .where('product_id', wishlistItem.product_id)
    .where('variation_id', wishlistItem.variation_id)
    .first();

  if (existingCartItem) {
    throw new Error('Item already exists in cart');
  }

  // Determine price and stock
  let price, stock;

  price = wishlistItem.selling_price || wishlistItem.price;
  stock = wishlistItem.stock;

  // Check stock availability
  if (stock < 1) {
    throw new Error('Product is out of stock');
  }

  // Add item to cart
  const cartItem = await knex('byt_cart_items')
    .insert({
      cart_id: cart.id,
      product_id: wishlistItem.product_id,
      variation_id: wishlistItem.variation_id,
      quantity: 1,
      price,
      total_price: price
    })
    .returning('*');

  // Remove from wishlist
  await knex('byt_wishlist_items')
    .where('id', wishlistItemId)
    .del();

  return cartItem;
}

// Get user's wishlist product IDs
export async function getUserWishlistProductIds(userId) {
  const wishlistItems = await knex('byt_wishlist_items')
    .select('product_id')
    .where('user_id', userId);

  return wishlistItems.map(item => item.product_id);
}

// Get product by ID
export async function getProductById(productId) {
  return knex('byt_products')
    .select('id', 'name', 'price', 'selling_price', 'stock', 'status')
    .where('id', productId)
    .where('deleted_at', null)
    .first();
}

// Get wishlist item by user and product
export async function getWishlistItemByUserAndProduct(userId, productId) {
  return knex('byt_wishlist_items')
    .where('user_id', userId)
    .where('product_id', productId)
    .first();
}
