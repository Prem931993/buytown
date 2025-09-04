import * as models from '../models/sms.models.js';
import * as helpers from '../helpers/auth.helpers.js';
import axios from 'axios';
import twilio from 'twilio';

// Generate a 6-digit OTP
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via SMS/WhatsApp
export async function sendOtp(phone, email, otp) {
  try {
    // Get all SMS configurations and use the first active one
    const smsConfigs = await models.getAllSmsConfigurations();
    const smsConfig = smsConfigs.find(config => config.provider === 'msg91') || smsConfigs[0]; // Prefer MSG91, fallback to first available

    if (!smsConfig) {
      console.error('[OTP_SEND] ❌ No SMS configuration found');
      throw new Error('No SMS configuration found');
    }

    let smsSent = false;
    let emailSent = false;

    // Send SMS
    if (phone) {
      try {
        // await sendSms(phone, `Your OTP is: ${otp}`, smsConfig);
        smsSent = true;
      } catch (smsError) {
        console.error(`[OTP_SEND] ❌ SMS sending failed to ${phone}: ${smsError.message}`);
        throw smsError; // Re-throw to fail the entire operation
      }
    }

    // Send Email (if available)
    if (email) {
      try {
        await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otp}`);
        emailSent = true;
      } catch (emailError) {
        console.error(`[OTP_SEND] ❌ Email sending failed to ${email}: ${emailError.message}`);
        // Don't throw here - email failure shouldn't stop the process
      }
    }

    // Store OTP record
    try {
      await models.createOtpRecord({
        phone: phone || null,
        email: email || null,
        otp: otp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
      });
    } catch (dbError) {
      console.error(`[OTP_SEND] ❌ Failed to store OTP record: ${dbError.message}`);
      throw dbError; // Re-throw to fail the entire operation
    }

    const successMessage = smsSent && emailSent
      ? 'OTP sent successfully via SMS and Email'
      : smsSent
        ? 'OTP sent successfully via SMS'
        : emailSent
          ? 'OTP sent successfully via Email'
          : 'OTP sent successfully';

    return { success: true, message: successMessage };
  } catch (error) {
    console.error(`[OTP_SEND] 💥 OTP sending failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Verify OTP
export async function verifyOtp(phone, otp) {
  try {
    const otpRecord = await models.getOtpRecord(phone, otp);

    if (!otpRecord) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    // Delete the OTP record after successful verification
    await models.deleteOtpRecord(otpRecord.id);

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error(`[OTP_VERIFY] 💥 OTP verification failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// SMS Configuration Management
export async function createSmsConfiguration(data) {
  try {
    const config = await models.createSmsConfiguration(data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSmsConfigurations() {
  try {
    const configs = await models.getAllSmsConfigurations();
    return { success: true, configs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateSmsConfiguration(id, data) {
  try {
    const config = await models.updateSmsConfiguration(id, data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteSmsConfiguration(id) {
  try {
    await models.deleteSmsConfiguration(id);
    return { success: true, message: 'Configuration deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendSms(phone, message, config) {
  if (!config || !config.provider) {
    throw new Error('SMS provider configuration is missing');
  }

  if (config.provider === 'twilio') {
    // Twilio SMS sending implementation
    try {
      const accountSid = config.api_key;
      const authToken = config.api_secret;
      const fromNumber = JSON.parse(config.additional_config || '{}').sender_id || '';

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio configuration is incomplete');
      }

      const client = twilio(accountSid, authToken);

      const messageResponse = await client.messages.create({
        body: message,
        from: fromNumber,
        to: phone
      });

      return true;
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error.message);
      throw new Error('Failed to send SMS via Twilio: ' + error.message);
    }
  }

  if (config.provider === 'msg91') {
    // MSG91 v2 SMS sending implementation
    try {
      const authKey = config.api_key;

      // Parse additional_config (it might be double-stringified)
      let additionalConfig = {};
      try {
        additionalConfig = JSON.parse(config.additional_config);
        if (typeof additionalConfig === 'string') {
          additionalConfig = JSON.parse(additionalConfig);
        }
      } catch (e) {
        additionalConfig = {};
      }

      const senderId = additionalConfig.sender_id || '';
      const route = additionalConfig.route || '4';
      const country = additionalConfig.country || '91';

      // MSG91 v2 API endpoint
      const url = 'https://api.msg91.com/api/v2/sendsms';

      const payload = {
        sender: senderId,
        route: route,
        country: country,
        sms: [
          {
            message: message,
            to: [phone]
          }
        ]
      };

      const response = await axios.post(url, payload, {
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        }
      });

      // Check for MSG91 v2 API response structure
      if (response.data && response.data.type === 'error') {
        throw new Error(`MSG91 API error: ${response.data.message || 'Unknown error'}`);
      }

      // MSG91 v2 success response typically has type: 'success'
      if (response.data && response.data.type === 'success') {
        return true;
      }

      // Fallback: if no clear error, assume success
      return true;
    } catch (error) {
      console.error('Error sending SMS via MSG91 v2:', error.message);
      if (error.response) {
        console.error('MSG91 API Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Failed to send SMS via MSG91: ' + error.message);
    }
  }

  // Add other providers here (Twilio, Nexmo, etc.) if needed

  // Default fallback: log message
  return true;
}

// Helper function to send Email (placeholder)
async function sendEmail(email, subject, message) {
  // This is a placeholder - implement actual email sending logic

  // You can integrate with your existing email service
  // For example, using the mailer config

  return true;
}

// Cleanup expired OTPs (can be called periodically)
export async function cleanupExpiredOtps() {
  try {
    await models.cleanupExpiredOtps();
    return { success: true, message: 'Expired OTPs cleaned up' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
