# Categories API

This module provides API endpoints for managing product categories in the BuyTown e-commerce platform.

## API Endpoints

### Get all categories
- **URL**: `/api/v1/categories`
- **Method**: `GET`
- **Description**: Retrieve all active categories
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "categories": [...]
  }
  ```

### Get root categories
- **URL**: `/api/v1/categories/root`
- **Method**: `GET`
- **Description**: Retrieve all root categories (categories with no parent)
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "categories": [...]
  }
  ```

### Get category by ID
- **URL**: `/api/v1/categories/:id`
- **Method**: `GET`
- **Description**: Retrieve a specific category by its ID
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "category": {...}
  }
  ```

### Get child categories
- **URL**: `/api/v1/categories/:parentId/children`
- **Method**: `GET`
- **Description**: Retrieve all child categories for a specific parent category
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "categories": [...]
  }
  ```

### Create category
- **URL**: `/api/v1/categories`
- **Method**: `POST`
- **Description**: Create a new category
- **Request Body**:
  ```json
  {
    "name": "Category Name",
    "description": "Category Description",
    "parent_id": 1, // Optional, for hierarchical categories
    "is_active": true // Optional, defaults to true
  }
  ```
- **Response**: 
  ```json
  {
    "statusCode": 201,
    "category": {...}
  }
  ```

### Update category
- **URL**: `/api/v1/categories/:id`
- **Method**: `PUT`
- **Description**: Update an existing category
- **Request Body**:
  ```json
  {
    "name": "Updated Category Name",
    "description": "Updated Category Description",
    "parent_id": 1, // Optional
    "is_active": true // Optional
  }
  ```
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "category": {...}
  }
  ```

### Delete category
- **URL**: `/api/v1/categories/:id`
- **Method**: `DELETE`
- **Description**: Delete a category (soft delete)
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "message": "Category deleted successfully"
  }
  ```

### Import categories from Excel
- **URL**: `/api/v1/categories/import`
- **Method**: `POST`
- **Description**: Import categories from an Excel file
- **Request**: Multipart form data with a file field named "file"
- **File Format**: Excel file with columns: Category Name, Description, Image
- **Response**: 
  ```json
  {
    "statusCode": 201,
    "message": "X categories imported successfully",
    "categories": [...]
  }
  ```

## Database Schema

The categories are stored in the `byt_categories` table with the following fields:
- `id`: Primary key
- `name`: Category name (required)
- `description`: Category description (optional)
- `image`: Image filename (optional)
- `parent_id`: Foreign key to support hierarchical categories (optional)
- `is_active`: Boolean flag for soft deletion (default: true)
- `created_at`: Timestamp when the category was created
- `updated_at`: Timestamp when the category was last updated

## Error Responses

All endpoints return appropriate HTTP status codes and error messages in the following format:
```json
{
  "statusCode": 404,
  "error": "Error message"
}