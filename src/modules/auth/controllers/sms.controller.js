import * as services from '../services/sms.services.js';

// Send OTP
export async function sendOtp(req, res) {
  const { phone, email } = req.body;

  if (!phone && !email) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Either phone or email is required'
    });
  }

  const result = await services.sendOtp(phone, email, services.generateOtp());

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

// Verify OTP
export async function verifyOtp(req, res) {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Phone and OTP are required'
    });
  }

  const result = await services.verifyOtp(phone, otp);

  if (!result.success) {
    return res.status(result.error === 'Invalid or expired OTP' ? 400 : 500).json({
      statusCode: result.error === 'Invalid or expired OTP' ? 400 : 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: result.message
  });
}

// Get SMS Configurations
export async function getSmsConfigurations(req, res) {
  const result = await services.getSmsConfigurations();

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

// Create SMS Configuration
export async function createSmsConfiguration(req, res) {
  const { provider, api_key, api_secret: originalApiSecret, additional_config } = req.body;

  if (!provider || !api_key) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Provider and API key are required'
    });
  }

  // For MSG91, api_secret is not required as it uses Auth Key only
  // But the database schema requires api_secret to be NOT NULL, so set to empty string if missing
  let api_secret = originalApiSecret;
  if (provider === 'msg91' && !api_secret) {
    api_secret = '';
  }

  if (provider !== 'msg91' && !api_secret) {
    return res.status(400).json({
      statusCode: 400,
      error: 'API secret is required for this provider'
    });
  }

  // For Twilio, additional_config.sender_id (sender phone number) is required
  if (provider === 'twilio') {
    let parsedAdditionalConfig = additional_config;
    if (typeof additional_config === 'string') {
      try {
        parsedAdditionalConfig = JSON.parse(additional_config);
      } catch (e) {
        parsedAdditionalConfig = {};
      }
    }

    if (!parsedAdditionalConfig || !parsedAdditionalConfig.sender_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Sender phone number is required for Twilio configuration'
      });
    }
  }

  // Handle additional_config - it might already be a string from frontend
  let finalAdditionalConfig = additional_config;
  if (typeof additional_config === 'object') {
    finalAdditionalConfig = JSON.stringify(additional_config);
  }

  const result = await services.createSmsConfiguration({
    provider,
    api_key,
    api_secret: api_secret, // Now api_secret is set to empty string for MSG91 if missing
    additional_config: finalAdditionalConfig
  });

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(201).json({
    statusCode: 201,
    message: 'SMS configuration created successfully',
    config: result.config
  });
}

// Update SMS Configuration
export async function updateSmsConfiguration(req, res) {
  const { id } = req.params;
  const { provider, api_key, api_secret, additional_config } = req.body;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  // For Twilio, additional_config.sender_id (sender phone number) is required
  if (provider === 'twilio') {
    let parsedAdditionalConfig = additional_config;
    if (typeof additional_config === 'string') {
      try {
        parsedAdditionalConfig = JSON.parse(additional_config);
      } catch (e) {
        parsedAdditionalConfig = {};
      }
    }

    if (!parsedAdditionalConfig || !parsedAdditionalConfig.sender_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Sender phone number is required for Twilio configuration'
      });
    }
  }

  const updateData = {};
  if (provider) updateData.provider = provider;
  if (api_key) updateData.api_key = api_key;
  if (api_secret) updateData.api_secret = api_secret;
  if (additional_config) {
    // Handle additional_config - it might already be a string from frontend
    let finalAdditionalConfig = additional_config;
    if (typeof additional_config === 'object') {
      finalAdditionalConfig = JSON.stringify(additional_config);
    }
    updateData.additional_config = finalAdditionalConfig;
  }

  const result = await services.updateSmsConfiguration(id, updateData);

  if (!result.success) {
    return res.status(500).json({
      statusCode: 500,
      error: result.error
    });
  }

  res.status(200).json({
    statusCode: 200,
    message: 'SMS configuration updated successfully',
    config: result.config
  });
}

// Delete SMS Configuration
export async function deleteSmsConfiguration(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Configuration ID is required'
    });
  }

  const result = await services.deleteSmsConfiguration(id);

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

// Cleanup expired OTPs
export async function cleanupExpiredOtps(req, res) {
  const result = await services.cleanupExpiredOtps();

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
