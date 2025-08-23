# Products Module

## Overview
This module handles all product-related functionality including parent-child product relationships.

## Parent-Child Product Relationships

### Database Structure
- `byt_products` table has:
  - `product_type` column (enum: 'simple', 'parent', 'child')
  - `parent_product_id` column (references another product)

- `byt_product_parent_child` junction table:
  - `parent_product_id` (references byt_products.id)
  - `child_product_id` (references byt_products.id)

### API Endpoints

#### Create Parent Product
```
POST /api/v1/products
{
  "name": "iPhone 12 Series",
  "product_type": "parent",
  "child_product_ids": [1, 2, 3],
  "price": 0
}
```

Note: Parent products will automatically have their price set to 0 if not provided.

#### Create Child Product
```
POST /api/v1/products
{
  "name": "iPhone 12 Pro",
  "product_type": "child",
  "parent_product_id": 4
}
```

#### Update Parent Product with Child Products
```
PUT /api/v1/products/:id
{
  "name": "Updated iPhone 12 Series",
  "product_type": "parent",
  "child_product_ids": [1, 2, 3, 5]
}
```

### Import Functionality
When importing products from Excel:
1. First pass: Create all products without parent-child relationships
2. Second pass: Update parent-child relationships based on parent_sku column
3. Third pass: Handle parent products that have child products but no parent_sku

### Search Functionality
The search functionality works on product names. For child products, you can search by:
- Parent product name
- Child product name
- SKU codes

### Error Handling
Common errors:
- "column child_product_ids of relation byt_products does not exist" - This occurs when child_product_ids is passed directly to the database. The fix is to remove this field from productData before database operations.