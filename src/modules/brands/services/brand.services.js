import * as models from '../models/brand.models.js';
import exceljs from 'exceljs';
import knex from '../../../config/db.js';

const { Workbook } = exceljs;

// Get all brands with pagination and search
export async function getAllBrandsService({ page = 1, limit = 10, search = '' } = {}) {
  try {
    const brands = await models.getAllBrandsPaginated({ page, limit, search });
    const totalCount = await models.getBrandsCount({ search });
    const totalPages = Math.ceil(totalCount / limit);
    
    return { 
      brands, 
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

// Get brand by ID
export async function getBrandByIdService(id) {
  try {
    const brand = await models.getBrandById(id);
    if (!brand) {
      return { error: 'Brand not found', status: 404 };
    }
    return { brand, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Create a new brand
export async function createBrandService(brandData) {
  try {
    // Validate required fields
    if (!brandData.name) {
      return { error: 'Brand name is required', status: 400 };
    }

    // Check if brand with same name already exists
    const existingBrand = await knex('byt_brands')
      .where({ name: brandData.name })
      .first();
      
    if (existingBrand) {
      return { error: 'Brand with this name already exists', status: 409 };
    }

    const brand = await models.createBrand(brandData);
    return { brand, status: 201 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Update brand by ID
export async function updateBrandService(id, brandData) {
  try {
    // Check if brand exists
    const existingBrand = await models.getBrandById(id);
    if (!existingBrand) {
      return { error: 'Brand not found', status: 404 };
    }

    // Check if another brand with same name already exists
    if (brandData.name) {
      const duplicateBrand = await knex('byt_brands')
        .where({ name: brandData.name })
        .whereNot({ id })
        .first();
        
      if (duplicateBrand) {
        return { error: 'Brand with this name already exists', status: 409 };
      }
    }

    const brand = await models.updateBrand(id, brandData);
    return { brand, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete brand by ID
export async function deleteBrandService(id) {
  try {
    // Check if brand exists
    const existingBrand = await models.getBrandById(id);
    if (!existingBrand) {
      return { error: 'Brand not found', status: 404 };
    }

    await models.deleteBrand(id);
    return { message: 'Brand deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Import brands from Excel file
export async function importBrandsFromExcelService(fileBuffer) {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet) {
      return { error: 'No worksheet found in Excel file', status: 400 };
    }

    const brands = [];
    const errors = [];
    const createdBrands = [];

    // Process each row in the worksheet (skip header row)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Skip empty rows
      if (!row || !row.getCell(1).value) {
        continue;
      }

      try {
        const brandName = row.getCell(1).value;
        const description = row.getCell(2).value || '';
        const image = row.getCell(3).value || null;

        // Validate brand name
        if (!brandName) {
          errors.push(`Row ${rowNumber}: Brand name is required`);
          continue;
        }

        // Create brand data object
        const brandData = {
          name: brandName.toString().trim(),
          description: description ? description.toString().trim() : '',
          image: image ? image.toString().trim() : null
        };

        // Check if brand already exists
        const existingBrand = await knex('byt_brands')
          .where({ name: brandData.name })
          .first();

        if (existingBrand) {
          errors.push(`Row ${rowNumber}: Brand '${brandData.name}' already exists`);
          continue;
        }

        // Create the brand
        const brand = await models.createBrand(brandData);
        createdBrands.push(brand);
        brands.push(brandData);
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
      }
    }

    return {
      message: `${createdBrands.length} brands imported successfully`,
      brands: createdBrands,
      errors: errors.length > 0 ? errors : undefined,
      status: errors.length > 0 && createdBrands.length === 0 ? 400 : 201
    };
  } catch (error) {
    return { error: `Failed to process Excel file: ${error.message}`, status: 500 };
  }
}