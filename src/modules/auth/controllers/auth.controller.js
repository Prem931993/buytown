import * as services from '../services/auth.services.js';
import { setAuditLog } from '../helpers/auth.helpers.js';

export async function register(req, res) {
  try {
    // Extract files from multer
    const files = req.files || {};
    const profilePhoto = files.profile_photo ? files.profile_photo[0] : null;
    const license = files.license ? files.license[0] : null;

    // Prepare data with files
    // Defensive: ensure req.body is defined and is an object
    const bodyData = req.body && typeof req.body === 'object' ? req.body : {};

    const userData = {
      ...bodyData,
      profile_photo: profilePhoto,
      license: license
    };

    const result = await services.registerService(userData);
    setAuditLog(req, {
      userId: result.user?.id,
      identity: req.body.email || req.body.phone_no,
      attemptType: 'register',
      success: !result.error,
      role: req.body.role_id
    });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, message: 'Registration successful. You can now log in with your credentials.' });
  } catch (error) {
    console.error('Error in register controller:', error);
    return res.status(500).json({ statusCode: 500, error: 'Internal server error during registration' });
  }
}

export async function login(req, res) {
  const apiRole = req?.apiClient?.role ?? "";
  const result = await services.loginService({ ...req.body, user_agent: req.get('User-Agent'), ip: req.ip }, apiRole);
  setAuditLog(req, {
    userId: result.user?.id,
    identity: req.body.identity,
    attemptType: 'login',
    success: !result.error,
    role: result.user?.role_id
  });
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({
    statusCode: result.status,
    message: 'Login successful.',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    ...(result.adminToken && { adminToken: result.adminToken })
  });
}

export async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  const result = await services.refreshTokenService(refreshToken, req);
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, accessToken: result.accessToken, refreshToken: result.refreshToken });
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  const result = await services.logoutService(refreshToken, req);
  setAuditLog(req, {
    userId: result.session?.user_id,
    identity: '',
    attemptType: 'logout',
    success: !result.error,
    role: result.session?.role_id
  });
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, message: result.message });
}

export async function forgotPassword(req, res) {
  const { identity } = req.body;
  const result = await services.forgotPasswordService(identity, req);
  setAuditLog(req, {
    userId: result.user?.id,
    identity: identity,
    attemptType: 'forgot_password',
    success: !result.error,
    role: result.user?.role_id
  });
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, message: result.message });
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  const result = await services.resetPasswordService(token, newPassword, req);
  setAuditLog(req, {
    userId: result.user?.id,
    identity: '',
    attemptType: 'reset_password',
    success: !result.error,
    role: result.user?.role_id
  });
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, message: result.message });
}

export async function generateApiToken(req, res) {
  const { client_id, client_secret } = req.body;
  const result = await services.generateApiTokenService(client_id, client_secret);
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, message: result.message, apiToken: result.apiToken });
}

export async function generateAdminApiToken(req, res) {
  // The user is already authenticated via verifyUserToken middleware
  const user = req.user;

  if (!user || user.role_id !== 1) {
    return res.status(403).json({ statusCode: 403, error: 'Admin access required' });
  }

  const result = await services.generateAdminApiTokenService(user.id);
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({ statusCode: result.status, message: result.message, apiToken: result.apiToken });
}

export async function validatePhone(req, res) {
  const { phone_no } = req.body;
  if (!phone_no) {
    return res.status(400).json({ statusCode: 400, error: 'Phone number is required.' });
  }
  const result = await services.validatePhoneService(phone_no);
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(200).json({ statusCode: 200, valid: result.valid, userId: result.userId, hasPassword: result.hasPassword, message: result.message });
}

export async function setPassword(req, res) {
  const { userId, newPassword, otp } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ statusCode: 400, error: 'userId and newPassword are required.' });
  }
  const result = await services.setPasswordService(userId, newPassword, req.get('User-Agent'), req.ip, otp);
  setAuditLog(req, {
    userId: result.user?.id,
    identity: '',
    attemptType: 'setPassword',
    success: !result.error,
    role: result.user?.role_id
  });
  if (result.error) {
    return res.status(result.status).json({ statusCode: result.status, error: result.error });
  }
  res.status(result.status).json({
    statusCode: result.status,
    message: result.message,
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
}

export async function verifyToken(req, res) {
  try {
    // The token is already verified by the middleware
    // If we reach here, the token is valid
    const user = req.user;
    
    // Get full user details
    const userDetails = await services.getUserDetailsById(user.id);
    
    if (!userDetails) {
      return res.status(404).json({ statusCode: 404, error: 'User not found' });
    }
    
    return res.status(200).json({
      statusCode: 200,
      user: {
        id: userDetails.id,
        firstname: userDetails.firstname,
        lastname: userDetails.lastname,
        email: userDetails.email,
        phone_no: userDetails.phone_no,
        role_id: userDetails.role_id
      }
    });
  } catch (error) {
    console.error('Error in verify token:', error);
    return res.status(401).json({ statusCode: 401, error: 'Invalid token' });
  }
}
