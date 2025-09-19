import * as services from '../services/variation.services.js';

// Get all variations
export async function getAllVariations(req, res) {
  const { page, limit, search } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  try {
    const result = await services.getAllVariationsService({ page: pageNum, limit: limitNum, search });
    res.status(result.status).json({ statusCode: result.status, variations: result.variations, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get variation by ID
export async function getVariationById(req, res) {
  const { id } = req.params;
  try {
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
  const { id } = req.params;
  try {
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
  const { id } = req.params;
  try {
    const result = await services.deleteVariationService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get variations for dropdown
export async function getVariationsForDropdown(req, res) {
  try {
    const result = await services.getVariationsForDropdownService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, variations: result.variations });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// New autocomplete variations handler
export async function autocompleteVariations(req, res) {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.status(200).json({ statusCode: 200, variations: [] });
  }
  try {
    const allVariations = await services.getVariationsForDropdownService();
    if (allVariations.error) {
      return res.status(allVariations.status).json({ statusCode: allVariations.status, error: allVariations.error });
    }
    // Filter variations by label matching query (case-insensitive)
    const filtered = allVariations.variations.filter(v => v.label.toLowerCase().includes(q.toLowerCase()));
    res.status(200).json({ statusCode: 200, variations: filtered });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Import variations from Excel file
export async function importVariationsFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ statusCode: 400, error: 'No file uploaded' });
    }

    const result = await services.importVariationsFromExcelService(req.file.buffer);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      variations: result.variations,
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
