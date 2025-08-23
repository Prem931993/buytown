import * as models from '../models/auth.models.js';
import * as helpers from '../helpers/auth.helpers.js';
import * as validators from '../validators/auth.validators.js';
import logger from '../../../config/logger.js';
import knex from '../../../config/db.js';

export async function registerService(data) {
  const error = validators.validateRegisterInput(data);
  if (error) return { error, status: 400 };

  const { username, email, phone_no, password, role_id, gstin, address } = data;

  // Check for duplicate
  const existingUser = await models.findUserByEmail(email) || await models.findUserByPhone(phone_no);
  if (existingUser) {
    let conflictField = email && existingUser.email === email ? 'email address' : 'phone number';
    return {
      error: `An account with this ${conflictField} already exists. Please use a different ${conflictField} or log in instead.`,
      status: 409
    };
  }

  const hashed = password ? await helpers.hashPassword(password) : null;
  const [user] = await models.createUser({ username, email, phone_no, password: hashed, role_id, gstin, address });

  return { user, status: 201 };
}

export async function loginService(data, apiRole) {
  const error = validators.validateLoginInput(data);
  if (error) return { error, status: 400 };

  const { identity, password, user_agent, ip } = data;
  const user = await models.findUserByIdentity(identity);
  if (!user) return { error: 'No account found for the provided identity. Please check your credentials and try again.', status: 401 };

  const failRecord = await models.getFailedAttempt(user.id);
  if (failRecord && failRecord.attempt_count >= 5) {
    return { error: 'Too many failed login attempts. Please try again later.', status: 403 };
  }

  const valid = await helpers.comparePassword(password, user.password);
  if (!valid) {
    await models.insertFailedAttempt(user.id, identity);
    return { error: 'Incorrect password. Please double-check and try again.', status: 401 };
  }

  if (apiRole !== user.role_id) {
    return { error: 'Your account does not have permission to use this page.', status: 403 };
  }

  await models.resetFailedAttempts(user.id);

  const accessToken = helpers.generateToken(
    { id: user.id, role_id: user.role_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );
  const refreshToken = helpers.generateToken(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );

  await models.insertUserSession({
    user_id: user.id,
    refresh_token: refreshToken,
    user_agent,
    ip_address: ip,
    expires_at: knex.raw(`NOW() + interval '${process.env.REFRESH_TOKEN_EXPIRES_IN}'`)
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone_no: user.phone_no,
      role_id: user.role_id
    },
    accessToken,
    refreshToken,
    status: 200
  };
}

export async function refreshTokenService(refreshToken, req) {
  if (!refreshToken) return { error: 'Refresh token required.', status: 400 };
  try {
    const payload = helpers.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await models.findSessionByToken(refreshToken, payload.id);
    if (!session) return { error: 'Invalid or expired refresh token.', status: 403 };
    const user = await models.findUserByIdentity(payload.id);
    const newAccessToken = helpers.generateToken(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );
    const newRefreshToken = helpers.generateToken(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );
    await models.deleteSessionById(session.id);
    await models.insertUserSession({
      user_id: user.id,
      refresh_token: newRefreshToken,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      expires_at: knex.raw(`NOW() + interval '${process.env.REFRESH_TOKEN_EXPIRES_IN}'`)
    });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken, status: 200 };
  } catch (err) {
    return { error: 'Invalid or expired refresh token.', status: 403 };
  }
}

export async function logoutService(refreshToken, req) {
  if (!refreshToken) return { error: 'Refresh token required.', status: 400 };
  try {
    const decoded = helpers.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await models.findSessionByToken(refreshToken, decoded.id);
    if (!session) return { error: 'Invalid refresh token.', status: 400, session: session };
    await models.deleteSessionById(session.id);
    return { message: 'Logged out successfully.', status: 200, session: session };
  } catch (err) {
    return { error: 'Invalid or expired refresh token.', status: 401 };
  }
}

export async function forgotPasswordService(identity, req) {
  const error = validators.validateForgotPasswordInput({ identity });
  if (error) return { error, status: 400 };
  // Determine if identity is email or phone
  let user;
  if (identity.includes('@')) {
    user = await models.findUserByEmail(identity);
  } else {
    user = await models.findUserByPhone(identity);
  }
  if (!user) return { error: 'No account found with this identity.', status: 404 };
  const token = helpers.generateRandomToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await models.insertPasswordReset({ user_id: user.id, token, expires_at: expiresAt });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await helpers.sendResetEmail(user.email, resetLink);
  return { message: 'Password reset link sent. Please check your email.', status: 200, user };
}

export async function resetPasswordService(token, newPassword, req) {
  const error = validators.validateResetPasswordInput({ token, newPassword });
  if (error) return { error, status: 400 };
  const reset = await models.findPasswordResetByToken(token);
  if (!reset) return { error: 'Invalid or expired reset token.', status: 400, reset: reset };
  const user = await models.findUserById(reset.user_id);
  const hashed = await helpers.hashPassword(newPassword);
  await models.updateUserPassword(reset.user_id, hashed);
  await models.deletePasswordResetByUserId(reset.user_id);
  return { message: 'Password reset successfully. You can now log in with your new password.', status: 200, user: user };
}

export async function generateApiTokenService(client_id, client_secret) {
  const error = validators.validateApiTokenInput({ client_id, client_secret });
  if (error) return { error, status: 400 };
  const credential = await models.findApiCredential(client_id);
  if (!credential) {
    logger.error('Invalid client_id provided to generateApiTokenService');
    return { error: 'Invalid client credentials. Please verify your client_id.', status: 401 };
  }
  const incomingHash = helpers.sha256(client_secret);
  if (incomingHash !== credential.client_secret) {
    logger.error('Invalid client_secret provided to generateApiTokenService');
    return { error: 'Invalid client credentials. Please verify your client_secret.', status: 401 };
  }
  const apiToken = helpers.generateToken(
    { client_id: credential.client_id, role: credential.role },
    process.env.JWT_API_SECRET,
    { expiresIn: '1d' }
  );
  logger.info('API token generated successfully for client_id: ' + client_id);
  return { message: 'API token generated successfully.', apiToken, status: 200 };
}

export async function validatePhoneService(phone_no) {
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'User not found.', status: 404 };
  }
  return {
    valid: true,
    userId: user.id,
    hasPassword: !!user.password,
    status: 200
  };
}

export async function getUserDetailsById(userId) {
  if (!userId) {
    return null;
  }
  return await models.findUserById(userId);
}

export async function setPasswordService(userId, newPassword) {
  const user = await models.findUserById(userId);
  if (!user) {
    return { error: 'User not found.', status: 404 };
  }
  if (user.password) {
    return { error: 'Password already set for this user.', status: 400, user: user };
  }
  const hashed = await helpers.hashPassword(newPassword);
  await models.updateUserPassword(userId, hashed);
  return { message: 'Password set successfully.', status: 200, user: user };
}