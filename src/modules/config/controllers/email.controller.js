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
    config_type,
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
    token_expires_at,
    sendgrid_api_key
  } = req.body;

  // Validate config_type
  if (!config_type || !['smtp', 'gmail_app_password', 'oauth2', 'sendgrid'].includes(config_type)) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Valid config_type is required (smtp, gmail_app_password, oauth2, or sendgrid)'
    });
  }

  // Validate required fields based on config_type
  if (config_type === 'smtp' || config_type === 'gmail_app_password') {
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password || !from_email || !from_name) {
      return res.status(400).json({
        statusCode: 400,
        error: 'SMTP configuration fields are required for SMTP and Gmail App Password types'
      });
    }
  } else if (config_type === 'oauth2') {
    if (!mail_user || !mail_client_id || !mail_client_secret || !from_email || !from_name) {
      return res.status(400).json({
        statusCode: 400,
        error: 'OAuth2 configuration fields are required for OAuth2 type'
      });
    }
  } else if (config_type === 'sendgrid') {
    if (!sendgrid_api_key || !from_email || !from_name) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Sendgrid API key, from email, and from name are required for Sendgrid type'
      });
    }
  }

  const result = await services.createEmailConfiguration({
    config_type,
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
    token_expires_at: token_expires_at && token_expires_at !== '' ? token_expires_at : null,
    sendgrid_api_key
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
      config_type,
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
      token_expires_at,
      sendgrid_api_key
    } = req.body;

    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Configuration ID is required'
      });
    }

    // Validate config_type if provided
    if (config_type && !['smtp', 'gmail_app_password', 'oauth2', 'sendgrid'].includes(config_type)) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Valid config_type is required (smtp, gmail_app_password, oauth2, or sendgrid)'
      });
    }

    const updateData = {};
    if (config_type !== undefined) updateData.config_type = config_type;
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
    if (token_expires_at !== undefined) updateData.token_expires_at = token_expires_at && token_expires_at !== '' ? token_expires_at : null;
    if (sendgrid_api_key !== undefined) updateData.sendgrid_api_key = sendgrid_api_key;

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
