import jwt from 'jsonwebtoken';
import knex from '../../../config/db.js';

const { verify } = jwt;

export default async function verifyUserDualAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const userTokenHeader = req.headers['x-user-token'];

  if (!authHeader || !userTokenHeader) {
    return res.status(401).json({ error: 'Missing authorization headers' });
  }

  // Accept tokens with or without Bearer prefix
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const userToken = userTokenHeader.startsWith('Bearer ') ? userTokenHeader.slice(7) : userTokenHeader;

  if (!accessToken || !userToken) {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  try {
    // Verify JWT token with access secret
    const decodedAccess = verify(accessToken, process.env.JWT_API_SECRET);

    // Verify user token with access secret (user access token)
    const decodedUser = verify(userToken, process.env.JWT_ACCESS_SECRET);

    // Check if JWT token has valid user info
    if (!decodedAccess || decodedAccess.role !== 2) { // role 2 = regular user
      return res.status(401).json({ error: 'Access token requires user role' });
    }

    // Check if user token has valid user info
    if (!decodedUser || !decodedUser.id) {
      return res.status(401).json({ error: 'Invalid user token payload' });
    }

    // Verify user exists in database
    const user = await knex('byt_users').where({ id: decodedUser.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status !== 1) {
      return res.status(403).json({ error: 'User account is not active' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      role_id: user.role_id,
      phone_no: user.phone_no,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname
    };

    next();
  } catch (err) {
    console.error('verifyUserDualAuth - Token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid tokens' });
  }
}
