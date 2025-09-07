import * as models from '../models/category.models.js';
import exceljs from 'exceljs';
import knex from '../../../config/db.js';

const { Workbook } = exceljs;

// Get all categories with pagination and search
export async function getAllCategoriesService({ page = 1, limit = 10, search = '' } = {}) {
  try {
    const categories = await models.getAllCategories({ page, limit, search });
    const totalCount = await models.getCategoriesCount({ search });
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      status: 200
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get category by ID
export async function getCategoryByIdService(id) {
  try {
    const category = await models.getCategoryById(id);
    if (!category) {
      return { error: 'Category not found', status: 404 };
    }
    return { category, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Create a new category
export async function createCategoryService(categoryData) {
  try {
    // Validate required fields
    if (!categoryData.name) {
      return { error: 'Category name is required', status: 400 };
    }

    // Check if category with same name already exists
    const existingCategory = await knex('byt_categories')
      .where({ name: categoryData.name, parent_id: categoryData.parent_id || null })
      .first();
      
    if (existingCategory) {
      return { error: 'Category with this name already exists in the same parent', status: 409 };
    }

    const category = await models.createCategory(categoryData);
    return { category, status: 201 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Update category by ID
export async function updateCategoryService(id, categoryData) {
  try {
    // Check if category exists
    const existingCategory = await models.getCategoryById(id);
    if (!existingCategory) {
      return { error: 'Category not found', status: 404 };
    }

    // Check if another category with same name already exists
    if (categoryData.name) {
      const duplicateCategory = await knex('byt_categories')
        .where({ name: categoryData.name, parent_id: categoryData.parent_id || existingCategory.parent_id || null })
        .whereNot({ id })
        .first();
        
      if (duplicateCategory) {
        return { error: 'Category with this name already exists in the same parent', status: 409 };
      }
    }

    const category = await models.updateCategory(id, categoryData);
    return { category, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete category by ID
export async function deleteCategoryService(id) {
  try {
    // Check if category exists
    const existingCategory = await models.getCategoryById(id);
    if (!existingCategory) {
      return { error: 'Category not found', status: 404 };
    }

    // Check if category has child categories
    const childCategories = await models.getChildCategories(id);
    if (childCategories.length > 0) {
      return { error: 'Cannot delete category with child categories. Delete child categories first.', status: 400 };
    }

    await models.deleteCategory(id);
    return { message: 'Category deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Import categories from Excel file
export async function importCategoriesFromExcelService(fileBuffer) {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet) {
      return { error: 'No worksheet found in Excel file', status: 400 };
    }

    const categories = [];
    const errors = [];
    const createdCategories = [];

    // Process each row in the worksheet (skip header row)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Skip empty rows
      if (!row || !row.getCell(1).value) {
        continue;
      }

      try {
        const categoryName = row.getCell(1).value;
        const description = row.getCell(2).value || '';
        const image = row.getCell(3).value || null;

        // Validate category name
        if (!categoryName) {
          errors.push(`Row ${rowNumber}: Category name is required`);
          continue;
        }

        // Create category data object
        const categoryData = {
          name: categoryName.toString().trim(),
          description: description ? description.toString().trim() : '',
          image: image ? image.toString().trim() : null
        };

        // Check if category already exists
        const existingCategory = await knex('byt_categories')
          .where({ name: categoryData.name })
          .first();

        if (existingCategory) {
          errors.push(`Row ${rowNumber}: Category '${categoryData.name}' already exists`);
          continue;
        }

        // Create the category
        const category = await models.createCategory(categoryData);
        createdCategories.push(category);
        categories.push(categoryData);
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
      }
    }

    return {
      message: `${createdCategories.length} categories imported successfully`,
      categories: createdCategories,
      errors: errors.length > 0 ? errors : undefined,
      status: errors.length > 0 && createdCategories.length === 0 ? 400 : 201
    };
  } catch (error) {
    return { error: `Failed to process Excel file: ${error.message}`, status: 500 };
  }
}

// Get child categories by parent ID
export async function getChildCategoriesService(parentId) {
  try {
    // Check if parent category exists
    const parentCategory = await models.getCategoryById(parentId);
    if (!parentCategory) {
      return { error: 'Parent category not found', status: 404 };
    }

    const categories = await models.getChildCategories(parentId);
    return { categories, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get categories for dropdown (no pagination, just id and name)
export async function getCategoriesForDropdownService() {
  try {
    const categories = await models.getCategoriesForDropdown();
    return { categories, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get root categories (categories with no parent)
export async function getRootCategoriesService() {
  try {
    const categories = await models.getRootCategories();
    return { categories, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get all enabled categories with images for users
export async function getAllEnabledCategoriesWithImagesService() {
  try {
    const categories = await knex('byt_categories')
      .select('id', 'name', 'description', 'image', 'parent_id')
      .where({ is_active: true })
      .orderBy('id', 'asc');

    return { categories, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}
