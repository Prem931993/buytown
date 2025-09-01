import * as services from '../services/email.services.js';

// Get Email Configuration
export async function getEmailConfiguration(req, res) {
  const result = await services.getEmailConfiguration();

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

// Get All Email Configurations
export async function getAllEmailConfigurations(req, res) {
  const result = await services.getAllEmailConfigurations();

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

// Create Email Configuration
export async function createEmailConfiguration(req, res) {
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    smtp_secure,
    from_email,
    from_name,
    mail_user,
    mail_client_id,
    mail_client_secret,
    mail_refresh_token,
    mail_access_token,
    token_expires_at
  } = req.body;

  // Basic validation - either SMTP or OAuth2 fields must be provided
  const hasSMTP = smtp_host && smtp_port && smtp_user && smtp_password && from_email && from_name;
  const hasOAuth2 = mail_user && mail_client_id && mail_client_secret;

  if (!hasSMTP && !hasOAuth2) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Either SMTP configuration or OAuth2 configuration is required'
    });
  }

  const result = await services.createEmailConfiguration({
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    smtp_secure: smtp_secure || false,
    from_email,
    from_name,
    mail_user,
    mail_client_id,
    mail_client_secret,
    mail_refresh_token,
    mail_access_token,
    token_expires_at
  });

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(201).json({
    statusCode: 201,
    message: 'Email configuration created successfully',
    config: result.config
  });
}

// Update Email Configuration
export async function updateEmailConfiguration(req, res) {
  const { id } = req.params;
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    smtp_secure,
    from_email,
    from_name,
    mail_user,
    mail_client_id,
    mail_client_secret,
    mail_refresh_token,
    mail_access_token,
    token_expires_at
  } = req.body;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const updateData = {};
  if (smtp_host !== undefined) updateData.smtp_host = smtp_host;
  if (smtp_port !== undefined) updateData.smtp_port = smtp_port;
  if (smtp_user !== undefined) updateData.smtp_user = smtp_user;
  if (smtp_password !== undefined) updateData.smtp_password = smtp_password;
  if (smtp_secure !== undefined) updateData.smtp_secure = smtp_secure;
  if (from_email !== undefined) updateData.from_email = from_email;
  if (from_name !== undefined) updateData.from_name = from_name;
  if (mail_user !== undefined) updateData.mail_user = mail_user;
  if (mail_client_id !== undefined) updateData.mail_client_id = mail_client_id;
  if (mail_client_secret !== undefined) updateData.mail_client_secret = mail_client_secret;
  if (mail_refresh_token !== undefined) updateData.mail_refresh_token = mail_refresh_token;
  if (mail_access_token !== undefined) updateData.mail_access_token = mail_access_token;
  if (token_expires_at !== undefined) updateData.token_expires_at = token_expires_at;

  const result = await services.updateEmailConfiguration(id, updateData);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: 'Email configuration updated successfully',
    config: result.config
  });
}

// Delete Email Configuration
export async function deleteEmailConfiguration(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const result = await services.deleteEmailConfiguration(id);

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
