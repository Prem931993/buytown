// API Test Script for Categories Module
// This script tests the actual API endpoints using fetch

async function testCategoriesAPI() {
  const baseURL = 'http://localhost:5000/api/v1/categories';
  
  try {
    console.log('Testing Categories API Endpoints\n');
    
    // Test 1: Get all categories (should be empty initially)
    console.log('1. Testing GET /api/v1/categories');
    let response = await fetch(baseURL);
    let data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 2: Create a new category
    console.log('\n2. Testing POST /api/v1/categories');
    response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Electronics',
        description: 'Electronic devices and accessories'
      })
    });
    
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    const categoryId = data.category?.id;
    if (!categoryId) {
      console.log('Failed to create category');
      return;
    }
    
    console.log('Created category with ID:', categoryId);
    
    // Test 3: Get category by ID
    console.log('\n3. Testing GET /api/v1/categories/:id');
    response = await fetch(`${baseURL}/${categoryId}`);
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 4: Update category
    console.log('\n4. Testing PUT /api/v1/categories/:id');
    response = await fetch(`${baseURL}/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Electronics & Gadgets',
        description: 'Electronic devices, gadgets and accessories'
      })
    });
    
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 5: Create a child category
    console.log('\n5. Testing POST /api/v1/categories (child category)');
    response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Smartphones',
        description: 'Mobile phones and smartphones',
        parent_id: categoryId
      })
    });
    
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    const childCategoryId = data.category?.id;
    
    // Test 6: Get child categories
    console.log('\n6. Testing GET /api/v1/categories/:parentId/children');
    response = await fetch(`${baseURL}/${categoryId}/children`);
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 7: Get root categories
    console.log('\n7. Testing GET /api/v1/categories/root');
    response = await fetch(`${baseURL}/root`);
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 8: Delete category (soft delete)
    console.log('\n8. Testing DELETE /api/v1/categories/:id');
    response = await fetch(`${baseURL}/${childCategoryId}`, {
      method: 'DELETE'
    });
    
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    // Test 9: Get all categories again
    console.log('\n9. Testing GET /api/v1/categories (after delete)');
    response = await fetch(baseURL);
    data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);
    
    console.log('\nAll API tests completed!');
    
  } catch (error) {
    console.error('API test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file:${process.argv[1]}`) {
  testCategoriesAPI();
}

export default testCategoriesAPI;