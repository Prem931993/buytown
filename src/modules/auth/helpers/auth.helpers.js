import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { transporter } from '../../../config/mailer.js';

export const hashPassword = (password) => hash(password, 10);
export const comparePassword = (password, hashValue) => compare(password, hashValue);

export const generateToken = (payload, secret, options) =>
  jwt.sign(payload, secret, options);

export const verifyToken = (token, secret) =>
  jwt.verify(token, secret);

export const generateRandomToken = () =>
  crypto.randomBytes(32).toString('hex');

export const sendResetEmail = async (email, resetLink) => {
  await transporter.sendMail({
    from: '"Support" <no-reply@example.com>',
    to: email,
    subject: 'Password Reset Request',
    text: `To reset your password, click here: ${resetLink}`,
    html: `<p>To reset your password, click here: <a href="${resetLink}">${resetLink}</a></p>`,
  });
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