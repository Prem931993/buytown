# Product Import Excel Template

## Overview
This document describes the Excel template format for importing products into the Buytown system. The import supports all product fields including the HSN code.

## Excel Columns

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| name | Yes | Product name | "Wireless Bluetooth Headphones" |
| price | Yes | Product price | 2999.99 |
| description | No | Product description | "High-quality wireless headphones with noise cancellation" |
| category_id | No | Category ID | 1 |
| brand_id | No | Brand ID | 5 |
| brand | No | Brand name (alternative to brand_id) | "Sony" |
| sku_code | No | Stock Keeping Unit code | "WH-1000XM5" |
| hsn_code | No | HSN/SAC code for GST | "85183000" |
| color | No | Product color | "Black" |
| size_dimension | No | Size/Dimension | "30x20x10 cm" |
| weight_kg | No | Weight in kilograms | 0.5 |
| length_mm | No | Length in millimeters | 300 |
| width_mm | No | Width in millimeters | 200 |
| height_mm | No | Height in millimeters | 100 |
| selling_price | No | Selling price | 3499.99 |
| discount | No | Discount percentage | 15 |
| gst | No | GST percentage | 18 |
| unit | No | Unit of measurement | "pcs" |
| stock | No | Stock quantity | 100 |
| status | No | Product status (1=active, 2=out_of_stock, 3=discontinued) | 1 |
| parent_sku | No | Parent product SKU (for child products) | "WH-1000XM5-BLK" |

## Important Notes

1. **Required Fields**: Only `name` and `price` are mandatory.
2. **HSN Code**: The `hsn_code` column is optional but recommended for GST compliance.
3. **Brand Mapping**: You can use either `brand_id` (numeric ID) or `brand` (brand name) to specify the brand.
4. **Parent-Child Relationships**: Use `parent_sku` to create child products that belong to a parent product.
5. **Data Types**:
   - Numeric fields (price, weight_kg, etc.) should be numbers
   - Text fields can contain any text
   - Empty cells will be treated as null/empty values

## Sample Excel Data

| name | price | description | category_id | brand | sku_code | hsn_code | color | stock | status |
|------|-------|-------------|-------------|-------|----------|----------|-------|-------|--------|
| Wireless Headphones | 2999.99 | Premium wireless headphones | 1 | Sony | WH-1000XM5 | 85183000 | Black | 50 | 1 |
| Bluetooth Speaker | 1999.99 | Portable Bluetooth speaker | 1 | JBL | GO3 | 85182100 | Blue | 30 | 1 |
| USB Cable | 299.99 | High-speed USB cable | 2 | Generic | USB-2M | 85444299 | White | 100 | 1 |

## Import Process

1. Create an Excel file (.xlsx) with the columns listed above
2. Fill in your product data
3. Save the file
4. Use the `/products/import` API endpoint to upload the file
5. The system will process each row and create/update products accordingly

## Error Handling

- If a row has missing required fields (name or price), it will be skipped
- Invalid data types will be converted to appropriate defaults
- Import results will show success count and any errors encountered
- Products with duplicate SKU codes will be updated (not duplicated)

## HSN Code Information

HSN (Harmonized System of Nomenclature) codes are used for GST classification in India. Common HSN codes for electronics:
- 85183000: Headphones and earphones
- 85182100: Single loudspeakers
- 85444299: USB cables and connectors
- 84713010: Laptops and computers

Make sure to use the correct HSN code for your products to ensure proper GST calculation.
