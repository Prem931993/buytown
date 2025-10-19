import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as emailServices from '../../config/services/email.services.js';

export const hashPassword = (password) => hash(password, 10);
export const comparePassword = (password, hashValue) => compare(password, hashValue);

export const generateToken = (payload, secret, options) =>
  jwt.sign(payload, secret, options);

export const verifyToken = (token, secret) =>
  jwt.verify(token, secret);

export const generateRandomToken = () =>
  crypto.randomBytes(32).toString('hex');

export const sendResetEmail = async (email, resetLink) => {
  try {
    // Get email configuration from database
    const configResult = await emailServices.getEmailConfiguration();
    if (!configResult.success) {
      throw new Error('Email configuration not found or invalid');
    }

    const config = configResult.config;

    // Check if email configuration is enabled
    if (!config.enabled) {
      throw new Error('Email configuration is currently disabled. Please enable it to send emails.');
    }

    // Send email using the configured service
    const emailOptions = {
      from: config.from_email || '"BuyTown Support" <noreply@buytown.com>',
      to: email,
      subject: 'Password Reset Request - BuyTown',
      text: `Hello,

You have requested to reset your password for your BuyTown account.

To reset your password, please click the following link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
BuyTown Support Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E7BE4C;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your BuyTown account.</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}"
               style="background-color: #E7BE4C; color: #000000; padding: 12px 24px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Your Password
            </a>
          </p>
          <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            BuyTown Support Team
          </p>
        </div>
      `,
    };

    const sendResult = await emailServices.sendEmail(config, emailOptions);
    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send email');
    }

    return { success: true, messageId: sendResult.messageId };
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sha256 = (input) =>
  crypto.createHash('sha256').update(input).digest('hex');

export function setAuditLog(req, { userId, identity, attemptType, success, role }) {
  req.auditLog = {
    userId,
    identity,
    attemptType,
    success,
    role
  };
} 