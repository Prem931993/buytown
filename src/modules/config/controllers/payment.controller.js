import * as services from '../services/payment.services.js';

// Get Payment Configuration by gateway name
export async function getPaymentConfiguration(req, res) {
  const { gatewayName } = req.params;

  if (!gatewayName) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Gateway name is required'
    });
  }

  const result = await services.getPaymentConfiguration(gatewayName);

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

// Get All Payment Configurations
export async function getAllPaymentConfigurations(req, res) {
  const result = await services.getAllPaymentConfigurations();

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

// Create Payment Configuration
export async function createPaymentConfiguration(req, res) {
  const { gateway_name, api_key, api_secret, webhook_secret, is_active, is_sandbox, currency, description } = req.body;

  if (!gateway_name || !api_key || !api_secret) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Gateway name, API key, and API secret are required'
    });
  }

  const result = await services.createPaymentConfiguration({
    gateway_name,
    api_key,
    api_secret,
    webhook_secret: webhook_secret || null,
    is_active: is_active !== undefined ? is_active : true,
    is_sandbox: is_sandbox !== undefined ? is_sandbox : true,
    currency: currency || 'INR',
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
    message: 'Payment configuration created successfully',
    config: result.config
  });
}

// Update Payment Configuration
export async function updatePaymentConfiguration(req, res) {
  const { id } = req.params;
  const { gateway_name, api_key, api_secret, webhook_secret, is_active, is_sandbox, currency, description } = req.body;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const updateData = {};
  if (gateway_name) updateData.gateway_name = gateway_name;
  if (api_key) updateData.api_key = api_key;
  if (api_secret) updateData.api_secret = api_secret;
  if (webhook_secret !== undefined) updateData.webhook_secret = webhook_secret;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (is_sandbox !== undefined) updateData.is_sandbox = is_sandbox;
  if (currency) updateData.currency = currency;
  if (description !== undefined) updateData.description = description;

  const result = await services.updatePaymentConfiguration(id, updateData);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: 'Payment configuration updated successfully',
    config: result.config
  });
}

// Delete Payment Configuration
export async function deletePaymentConfiguration(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const result = await services.deletePaymentConfiguration(id);

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
