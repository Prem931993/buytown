import * as services from '../services/tax.services.js';

// Get Tax Configuration
export async function getTaxConfiguration(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Tax configuration ID is required'
    });
  }

  const result = await services.getTaxConfiguration(id);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    config: result.config
  });
}

// Get All Tax Configurations
export async function getAllTaxConfigurations(req, res) {
  const result = await services.getAllTaxConfigurations();

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    configs: result.configs
  });
}

// Create Tax Configuration
export async function createTaxConfiguration(req, res) {
  const { tax_name, tax_rate, tax_type, is_active, description } = req.body;

  if (!tax_name || !tax_rate || !tax_type) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Tax name, rate, and type are required'
    });
  }

  const result = await services.createTaxConfiguration({
    tax_name,
    tax_rate,
    tax_type,
    is_active: is_active !== undefined ? is_active : true,
    description: description || null
  });

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(201).json({
    statusCode: 201,
    message: 'Tax configuration created successfully',
    config: result.config
  });
}

// Update Tax Configuration
export async function updateTaxConfiguration(req, res) {
  const { id } = req.params;
  const { tax_name, tax_rate, tax_type, is_active, description } = req.body;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const updateData = {};
  if (tax_name) updateData.tax_name = tax_name;
  if (tax_rate !== undefined) updateData.tax_rate = tax_rate;
  if (tax_type) updateData.tax_type = tax_type;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (description !== undefined) updateData.description = description;

  const result = await services.updateTaxConfiguration(id, updateData);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: 'Tax configuration updated successfully',
    config: result.config
  });
}

// Delete Tax Configuration
export async function deleteTaxConfiguration(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const result = await services.deleteTaxConfiguration(id);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: result.message
  });
}
