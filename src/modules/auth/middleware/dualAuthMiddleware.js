import jwt from 'jsonwebtoken';
import knex from '../../../config/db.js';

const { verify } = jwt;

export default async function verifyDualAuth(req, res, next) {
  console.log("verifyDualAuth - Headers:", req.headers);
  const authHeader = req.headers['authorization'];
  const adminTokenHeader = req.headers['x-admin-token'];

  if (!authHeader || !adminTokenHeader) {
            console.log("decodedAccess", 'Missing authorization headers');
    return res.status(401).json({ error: 'Missing authorization headers' });
  }

  // Accept tokens with or without Bearer prefix
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const adminToken = adminTokenHeader.startsWith('Bearer ') ? adminTokenHeader.slice(7) : adminTokenHeader;

  if (!accessToken || !adminToken) {
        console.log("decodedAccess", 'Invalid authorization header format');
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  try {
    // Verify access token with API secret (since you send apiToken in Authorization header)
    const decodedAccess = verify(accessToken, process.env.JWT_API_SECRET);
    // Verify admin token with access secret (since you send accessToken in X-Admin-Token header)
    const decodedAdmin = verify(adminToken, process.env.JWT_ACCESS_SECRET);

    // For access token (API token), check role only since it may not have id
    if (!decodedAccess || decodedAccess.role !== 1) {
      return res.status(403).json({ error: 'Access token requires admin role' });
    }

    // Double-check role in DB for admin token user
    if (!decodedAdmin || !decodedAdmin.id) {
      return res.status(401).json({ error: 'Invalid admin token payload' });
    }
    const adminUser = await knex('byt_users').where({ id: decodedAdmin.id }).first();
    if (!adminUser) {
      return res.status(401).json({ error: 'Admin user not found' });
    }
    if (adminUser.role_id !== decodedAdmin.role_id) {
      return res.status(403).json({ error: 'Admin token role mismatch. Please login again.' });
    }

    // Check if adminUser has admin role (role_id = 1)
    if (adminUser.role_id !== 1) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    // Attach user info to request (using adminUser since accessToken doesn't have user id)
    req.user = {
      id: adminUser.id,
      role_id: adminUser.role_id
    };

    next();
  } catch (err) {
    console.log("err",err)
    console.error('verifyDualAuth - Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid access token' });
  }
}
