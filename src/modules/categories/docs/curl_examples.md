# Curl Examples for Categories API

This document provides curl command examples for testing the Categories API endpoints.

## Prerequisites

Make sure your server is running on `http://localhost:5000` and you have curl installed on your system.

## API Endpoints

### 1. Get all categories
```bash
curl -X GET http://localhost:5000/api/v1/categories
```

### 2. Get root categories
```bash
curl -X GET http://localhost:5000/api/v1/categories/root
```

### 3. Get category by ID
```bash
curl -X GET http://localhost:5000/api/v1/categories/1
```

### 4. Get child categories by parent ID
```bash
curl -X GET http://localhost:5000/api/v1/categories/1/children
```

### 5. Create a new category
```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and accessories"
  }'
```

### 6. Create a category with parent (child category)
```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphones",
    "description": "Mobile phones and smartphones",
    "parent_id": 1
  }'
```

### 7. Update a category
```bash
curl -X PUT http://localhost:5000/api/v1/categories/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics & Gadgets",
    "description": "Electronic devices, gadgets and accessories"
  }'
```

### 8. Delete a category (soft delete)
```bash
curl -X DELETE http://localhost:5000/api/v1/categories/1
```

### 9. Import categories from Excel file
```bash
curl -X POST http://localhost:5000/api/v1/categories/import \
  -F "file=@categories.xlsx"
```

### 10. Create a category with an image
```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -F "name=Electronics" \
  -F "description=Electronic devices and accessories" \
  -F "image=@product.jpg"
```

### 11. Update a category with an image
```bash
curl -X PUT http://localhost:5000/api/v1/categories/1 \
  -F "name=Electronics & Gadgets" \
  -F "description=Electronic devices, gadgets and accessories" \
  -F "image=@new_product.jpg"
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "statusCode": 404,
  "error": "Error message"
}
```

## Authentication

Note: If your API requires authentication, you'll need to include an authorization header:
```bash
curl -X GET http://localhost:5000/api/v1/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `YOUR_ACCESS_TOKEN` with a valid access token from your authentication system.