import * as models from '../models/email.models.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client
function createOAuth2Client(clientId, clientSecret, redirectUri = 'urn:ietf:wg:oauth:2.0:oob') {
  return new OAuth2(clientId, clientSecret, redirectUri);
}

// Get OAuth2 access token
export async function getOAuth2AccessToken(clientId, clientSecret, refreshToken) {
  try {
    const oauth2Client = createOAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token } = await oauth2Client.getAccessToken();
    return { success: true, accessToken: token };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Create email transporter based on configuration
export async function createEmailTransporter(config) {
  try {
    let transporter;
    if (config.config_type === 'oauth2') {
      // OAuth2 configuration
      if (!config.mail_client_id || !config.mail_client_secret || !config.mail_refresh_token) {
        throw new Error('OAuth2 configuration requires client_id, client_secret, and refresh_token');
      }

      const oauth2Client = createOAuth2Client(config.mail_client_id, config.mail_client_secret);
      oauth2Client.setCredentials({
        refresh_token: config.mail_refresh_token,
        access_token: config.mail_access_token,
        expiry_date: config.token_expires_at && config.token_expires_at !== '' ? new Date(config.token_expires_at).getTime() : null
      });

      // Get fresh access token if needed
      if (!config.mail_access_token || (config.token_expires_at && config.token_expires_at !== '' && new Date(config.token_expires_at) <= new Date())) {
        const { token } = await oauth2Client.getAccessToken();
        config.mail_access_token = token;
        // Update the configuration with new token
        await models.updateEmailConfiguration(config.id, {
          mail_access_token: token,
          token_expires_at: new Date(Date.now() + 3600000) // 1 hour from now
        });
      }

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.mail_user,
          clientId: config.mail_client_id,
          clientSecret: config.mail_client_secret,
          refreshToken: config.mail_refresh_token,
          accessToken: config.mail_access_token
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else if (config.config_type === 'smtp' || config.config_type === 'gmail_app_password') {
      // SMTP configuration
      if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
        throw new Error('SMTP configuration requires host, user, and password');
      }

      transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else if (config.config_type === 'sendgrid') {
      // SendGrid configuration
      if (!config.sendgrid_api_key) {
        throw new Error('SendGrid configuration requires API key');
      }

      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(config.sendgrid_api_key);
      // For SendGrid, we return the sgMail object instead of a transporter
      return { success: true, transporter: sgMail, isSendGrid: true };
    } else {
      throw new Error('Invalid email configuration: Unsupported config_type');
    }

    return { success: true, transporter };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send email using configured transporter
export async function sendEmail(config, emailOptions) {
  try {
    const transporterResult = await createEmailTransporter(config);
    if (!transporterResult.success) {
      return transporterResult;
    }

    if (transporterResult.isSendGrid) {
      // SendGrid specific sending
      const msg = {
        to: emailOptions.to,
        from: config.from_email || emailOptions.from,
        subject: emailOptions.subject,
        html: emailOptions.html,
        text: emailOptions.text,
      };

      // Add attachments for SendGrid if present
      if (emailOptions.attachments && emailOptions.attachments.length > 0) {
        msg.attachments = emailOptions.attachments.map(attachment => ({
          content: attachment.content.toString('base64'),
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment'
        }));
      }

      const result = await transporterResult.transporter.send(msg);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'] || 'sendgrid-sent', info: result };
    } else {
      // Nodemailer sending
      const info = await transporterResult.transporter.sendMail({
        from: config.from_email || emailOptions.from,
        ...emailOptions
      });

      return { success: true, messageId: info.messageId, info };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createEmailConfiguration(data) {
  try {
    const config = await models.createEmailConfiguration(data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getEmailConfiguration() {
  try {
    const config = await models.getEmailConfiguration();
    if (!config) {
      return { success: false, error: 'No email configuration found. Please configure email settings first.' };
    }
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllEmailConfigurations() {
  try {
    const configs = await models.getAllEmailConfigurations();
    return { success: true, configs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateEmailConfiguration(id, data) {
  try {
    const config = await models.updateEmailConfiguration(id, data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteEmailConfiguration(id) {
  try {
    await models.deleteEmailConfiguration(id);
    return { success: true, message: 'Email configuration deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
