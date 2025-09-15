import jwt from 'jsonwebtoken';
import knex from '../../../config/db.js';

const { sign, verify } = jwt;

export function verifyApiToken(...requiredRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: 'API token missing.' });
    }

    verify(token, process.env.JWT_API_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired API token.' });

      // ✅ Check if decoded.role matches any of the requiredRoles
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
      }
      req.apiClient = decoded; // attach decoded info for later use
      next();
    });
  };
}

export async function verifyUserToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ✅ Double-check role in DB
    const user = await knex('byt_users').where({ id: decoded.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role_id !== decoded.role_id) {
      return res.status(403).json({ error: 'Token role does not match user role. Please login again.' });
    }

    // ✅ Attach user info to request for later
    req.user = {
      id: user.id,
      role_id: user.role_id
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Admin access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ✅ Double-check role in DB
    const user = await knex('byt_users').where({ id: decoded.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'Admin user not found' });
    }

    if (user.role_id !== decoded.role_id) {
      return res.status(403).json({ error: 'Token role does not match user role. Please login again.' });
    }

    // ✅ Check if user has admin role (role_id = 1)
    if (user.role_id !== 1) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    // ✅ Attach admin user info to request for later
    req.admin = {
      id: user.id,
      role_id: user.role_id
    };

    next();
  } catch (err) {
    console.error('verifyAdminToken - Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

export function auditTrail(req, res, next) {
  res.on('finish', () => {
    const userId = req.auditLog?.userId || null;
    const identity = req.auditLog?.identity || '';
    const role = req.auditLog?.role || null;
    const attemptType = req.auditLog?.attemptType || 'unknown';
    const success = req.auditLog?.success || false;

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    knex('byt_login_audit_logs')
      .insert({
        user_id: userId,
        identity,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        attempt_type: attemptType,
        role
      })
      .catch((err) => {
        console.error('Failed to write audit log:', err);
      });
  });

  next();
}

