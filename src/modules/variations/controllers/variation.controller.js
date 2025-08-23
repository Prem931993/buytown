import * as services from '../services/variation.services.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Get all variations with pagination and search
export async function getAllVariations(req, res) {
  try {
    // Get pagination and search parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await services.getAllVariationsService({ page, limit, search });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ 
      statusCode: result.status, 
      variations: result.variations,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get variation by ID
export async function getVariationById(req, res) {
  try {
    const { id } = req.params;
    const result = await services.getVariationByIdService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, variation: result.variation });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Create a new variation
export async function createVariation(req, res) {
  try {
    const variationData = req.body;
    
    const result = await services.createVariationService(variationData);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, variation: result.variation });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Update variation by ID
export async function updateVariation(req, res) {
  try {
    const { id } = req.params;
    const variationData = req.body;
    
    const result = await services.updateVariationService(id, variationData);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, variation: result.variation });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete variation by ID
export async function deleteVariation(req, res) {
  try {
    const { id } = req.params;
    
    const result = await services.deleteVariationService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Import variations from Excel file
export async function importVariationsFromExcel(req, res) {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ statusCode: 400, error: 'No file uploaded' });
    }

    // Check if file is Excel
    if (!req.file.originalname.match(/\.(xlsx|xls)$/)) {
      return res.status(400).json({ statusCode: 400, error: 'Please upload an Excel file' });
    }

    const result = await services.importVariationsFromExcelService(req.file.buffer);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    const response = {
      statusCode: result.status,
      message: result.message,
      variations: result.variations
    };
    
    if (result.errors) {
      response.errors = result.errors;
    }
    
    res.status(result.status).json(response);
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Export multer upload middleware
export { upload };