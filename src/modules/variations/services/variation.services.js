import * as models from '../models/variation.models.js';
import exceljs from 'exceljs';
import knex from '../../../config/db.js';

const { Workbook } = exceljs;

// Get all variations with pagination and search
export async function getAllVariationsService({ page = 1, limit = 10, search = '' } = {}) {
  try {
    const variations = await models.getAllVariationsPaginated({ page, limit, search });
    const totalCount = await models.getVariationsCount({ search });
    const totalPages = Math.ceil(totalCount / limit);
    
    return { 
      variations, 
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

// Get variation by ID
export async function getVariationByIdService(id) {
  try {
    const variation = await models.getVariationById(id);
    if (!variation) {
      return { error: 'Variation not found', status: 404 };
    }
    return { variation, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Create a new variation
export async function createVariationService(variationData) {
  try {
    // Validate required fields
    if (!variationData.label) {
      return { error: 'Variation label is required', status: 400 };
    }
    
    if (!variationData.value) {
      return { error: 'Variation value is required', status: 400 };
    }

    // Check if variation with same label and value already exists
    const existingVariation = await knex('byt_variations')
      .where({ label: variationData.label, value: variationData.value })
      .first();
      
    if (existingVariation) {
      return { error: 'Variation with this label and value already exists', status: 409 };
    }

    const variation = await models.createVariation(variationData);
    return { variation, status: 201 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Update variation by ID
export async function updateVariationService(id, variationData) {
  try {
    // Check if variation exists
    const existingVariation = await models.getVariationById(id);
    if (!existingVariation) {
      return { error: 'Variation not found', status: 404 };
    }

    // Check if another variation with same label and value already exists
    if (variationData.label && variationData.value) {
      const duplicateVariation = await knex('byt_variations')
        .where({ label: variationData.label, value: variationData.value })
        .whereNot({ id })
        .first();
        
      if (duplicateVariation) {
        return { error: 'Variation with this label and value already exists', status: 409 };
      }
    }

    const variation = await models.updateVariation(id, variationData);
    return { variation, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete variation by ID
export async function deleteVariationService(id) {
  try {
    // Check if variation exists
    const existingVariation = await models.getVariationById(id);
    if (!existingVariation) {
      return { error: 'Variation not found', status: 404 };
    }

    await models.deleteVariation(id);
    return { message: 'Variation deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get variations for dropdown (no pagination, just id and name)
export async function getVariationsForDropdownService() {
  try {
    const variations = await models.getAllVariations();
    return { variations, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Import variations from Excel file
export async function importVariationsFromExcelService(fileBuffer) {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet) {
      return { error: 'No worksheet found in Excel file', status: 400 };
    }

    const variations = [];
    const errors = [];
    const createdVariations = [];

    // Process each row in the worksheet (skip header row)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Skip empty rows
      if (!row || !row.getCell(1).value) {
        continue;
      }

      try {
        const label = row.getCell(1).value;
        const value = row.getCell(2).value || '';

        // Validate variation label
        if (!label) {
          errors.push(`Row ${rowNumber}: Variation label is required`);
          continue;
        }

        // Create variation data object
        const variationData = {
          label: label.toString().trim(),
          value: value ? value.toString().trim() : ''
        };

        // Check if variation already exists
        const existingVariation = await knex('byt_variations')
          .where({ label: variationData.label, value: variationData.value })
          .first();

        if (existingVariation) {
          errors.push(`Row ${rowNumber}: Variation '${variationData.label}' with value '${variationData.value}' already exists`);
          continue;
        }

        // Create the variation
        const variation = await models.createVariation(variationData);
        createdVariations.push(variation);
        variations.push(variationData);
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
      }
    }

    return {
      message: `${createdVariations.length} variations imported successfully`,
      variations: createdVariations,
      errors: errors.length > 0 ? errors : undefined,
      status: errors.length > 0 && createdVariations.length === 0 ? 400 : 201
    };
  } catch (error) {
    return { error: `Failed to process Excel file: ${error.message}`, status: 500 };
  }
}
