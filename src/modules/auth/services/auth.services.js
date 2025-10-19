import * as models from '../models/auth.models.js';
import * as helpers from '../helpers/auth.helpers.js';
import * as validators from '../validators/auth.validators.js';
import logger from '../../../config/logger.js';
import knex from '../../../config/db.js';
import * as smsServices from './sms.services.js';
import * as smsModels from '../models/sms.models.js';
import { uploadToFTP } from '../../../config/ftp.js';

export async function registerService(data) {
  const error = validators.validateRegisterInput(data);
  if (error) return { error, status: 400 };

  const {
    firstname = '',
    lastname = '',
    email,
    phone_no,
    password,
    address,
    gstin,
    profile_photo,
    license,
    role,
    status = 'active'
  } = data;

  // Validate required fields based on role
  if (role === 'admin' && (!email || !password)) {
    return { error: 'Email and password are required for admin users', status: 400 };
  }

  if (role === 'delivery_person' && (!email && !phone_no)) {
    return { error: 'Either email or phone number is required for delivery persons', status: 400 };
  }

  if (!email && !phone_no) {
    return { error: 'Either email or phone number is required', status: 400 };
  }

  // Check for duplicate
  if (email) {
    const existingUserByEmail = await models.findUserByEmail(email);
    if (existingUserByEmail) {
      return {
        error: 'An account with this email address already exists. Please use a different email or log in instead.',
        status: 409
      };
    }
  }

  if (phone_no) {
    const existingUserByPhone = await models.findUserByPhone(phone_no);
    if (existingUserByPhone) {
      return {
        error: 'An account with this phone number already exists. Please use a different phone number or log in instead.',
        status: 409
      };
    }
  }

  const hashed = password ? await helpers.hashPassword(password) : null;

  // Map role string to role_id
  const roleMapping = {
    'admin': 1,
    'user': 2,
    'delivery_person': 3
  };

  const role_id = roleMapping[role] || 3; // Default to user role

  // Handle file uploads to FTP
  let profilePhotoUrl = null;
  let licenseUrl = null;

  try {
    // Upload profile photo if present
    if (profile_photo && profile_photo.buffer) {
      const uploadResult = await uploadToFTP(
        profile_photo.buffer,
        'users/profile_photos',
        'image'
      );
      profilePhotoUrl = uploadResult.secure_url;
    }

    // Upload license if present
    if (license && license.buffer) {
      const uploadResult = await uploadToFTP(
        license.buffer,
        'users/licenses',
        'auto'
      );
      licenseUrl = uploadResult.secure_url;
    }
  } catch (uploadError) {
    console.error('Error uploading files to FTP:', uploadError);
    return { error: 'Failed to upload files. Please try again.', status: 500 };
  }

  const userData = {
    firstname,
    lastname,
    email,
    phone_no,
    password: hashed,
    address,
    gstin,
    profile_photo: profilePhotoUrl,
    license: licenseUrl,
    role_id,
    status: status === 'active'
  };

  const [user] = await models.createUser(userData);

  return { user, status: 201 };
}

export async function loginService(data, apiRole) {
  const error = validators.validateLoginInput(data);
  if (error) return { error, status: 400 };

  const { identity, password, user_agent, ip } = data;
  const user = await models.findUserByIdentity(identity);
  if (!user) return { error: 'No account found for the provided identity. Please check your credentials and try again.', status: 401 };

  const failRecord = await models.getFailedAttempt(user.id);
  // if (failRecord && failRecord.attempt_count >= 5) {
  //   return { error: 'Too many failed login attempts. Please try again later.', status: 403 };
  // }

  const valid = await helpers.comparePassword(password, user.password);
  if (!valid) {
    await models.insertFailedAttempt(user.id, identity);
    return { error: 'Incorrect password. Please double-check and try again.', status: 401 };
  }

  if (![1, 2, 3].includes(user.role_id)) {
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

  // Generate admin token for admin users (role_id = 1)
  let adminToken = null;
  if (user.role_id === 1) {
    adminToken = helpers.generateToken(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_API_SECRET,
      { expiresIn: '1d' }
    );
  }

  // Extract device info from data if available
  const deviceInfo = {
    device_name: data.device_name || null,
    browser: data.browser || null,
    browser_version: data.browser_version || null,
    os: data.os || null,
    os_version: data.os_version || null,
    device_type: data.device_type || null,
    location: data.location || null,
    is_current_session: true,
    last_activity: knex.fn.now()
  };

  // Before inserting new session, mark all existing sessions for this user as not current
  await models.markAllSessionsNotCurrent(user.id);

  await models.insertUserSession({
    user_id: user.id,
    refresh_token: refreshToken,
    user_agent,
    ip_address: ip,
    expires_at: knex.raw(`NOW() + interval '${process.env.REFRESH_TOKEN_EXPIRES_IN}'`),
    ...deviceInfo
  });

  const response = {
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone_no: user.phone_no,
      role_id: user.role_id,
      agreedToTerms: user.terms_agreed || false
    },
    accessToken,
    refreshToken,
    status: 200
  };

  // Include admin token for admin users
  if (adminToken) {
    response.adminToken = adminToken;
  }

  return response;
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

// User logout service for user token invalidation
export async function userLogoutService(refreshToken, req) {
  if (!refreshToken) return { error: 'Refresh token required.', status: 400 };
  try {
    const decoded = helpers.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await models.findSessionByToken(refreshToken, decoded.id);
    if (!session) return { error: 'Invalid refresh token.', status: 400, session: session };

    // Verify that the session belongs to a user (role_id = 2)
    const user = await models.findUserById(session.user_id);
    if (!user || user.role_id !== 2) {
      return { error: 'Invalid user session.', status: 400 };
    }

    await models.deleteSessionById(session.id);
    return { message: 'User logged out successfully.', status: 200, session: session };
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
  // Use FRONTEND_URL environment variable or fallback to default localhost URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
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
    { expiresIn: '365d' }
  );
  logger.info('API token generated successfully for client_id: ' + client_id);
  return { message: 'API token generated successfully.', apiToken, status: 200 };
}

export async function validatePhoneService(phone_no) {
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'User not found.', status: 404 };
  }

  // Check if user has a password - return success with hasPassword flag
  if (user.password) {
    return {
      valid: true,
      userId: user.id,
      hasPassword: true,
      status: 200,
      message: 'User found with existing password'
    };
  }

  // Check OTP send attempts for rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Count OTP sends today for this phone
  const otpSendsToday = await smsModels.countOtpSendsToday(phone_no, today);
  if (otpSendsToday >= 5) {
    return { error: 'OTP send limit reached for today. Please try again tomorrow.', status: 429 };
  }

  // Check last OTP send time for cooldown
  const lastOtpSend = await smsModels.getLastOtpSend(phone_no);
  if (lastOtpSend && new Date(lastOtpSend.attempt_date) > oneMinuteAgo) {
    return { error: 'Please wait at least 1 minute before requesting another OTP.', status: 429 };
  }

  // Send OTP
  const otp = smsServices.generateOtp();
  const sendResult = await smsServices.sendOtp(phone_no, user.email, otp);
  if (!sendResult.success) {
    return { error: sendResult.error || 'Failed to send OTP', status: 500 };
  }

  // Log OTP send attempt
  await smsModels.logOtpSendAttempt(phone_no, user.id);

  return {
    valid: true,
    userId: user.id,
    hasPassword: false,
    status: 200,
    message: otp
  };
}

export async function getUserDetailsById(userId) {
  if (!userId) {
    return null;
  }
  return await models.findUserById(userId);
}

export async function setPasswordService(userId, newPassword, userAgent, ip, otp) {
  const user = await models.findUserById(userId);
  if (!user) {
    return { error: 'User not found.', status: 404 };
  }
  if (user.password) {
    return { error: 'Password already set for this user.', status: 400, user: user };
  }

  // Verify OTP before setting password
  if (!otp) {
    return { error: 'OTP is required to set password.', status: 400 };
  }
  const otpVerification = await smsServices.verifyOtp(user.phone_no, otp);
  if (!otpVerification.success) {
    return { error: otpVerification.error, status: 400 };
  }

  // Set the password
  const hashed = await helpers.hashPassword(newPassword);
  await models.updateUserPassword(userId, hashed);
  // Generate tokens (similar to loginService)
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

  // Create user session
  await models.insertUserSession({
    user_id: user.id,
    refresh_token: refreshToken,
    user_agent: userAgent,
    ip_address: ip,
    expires_at: knex.raw(`NOW() + interval '${process.env.REFRESH_TOKEN_EXPIRES_IN}'`)
  });

  return {
    message: 'Password set successfully. You are now logged in.',
    status: 200,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone_no: user.phone_no,
      role_id: user.role_id
    },
    accessToken,
    refreshToken
  };
}

// User Forgot Password Service - sends OTP via SMS
export async function userForgotPasswordService(phone_no, req) {
  // Validate input
  if (!phone_no) {
    return { error: 'Phone number is required.', status: 400 };
  }

  // Find user by phone number
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'No account found with this phone number.', status: 404 };
  }

  // Check if user has a password set (only allow reset if password exists)
  if (!user.password) {
    return { error: 'Password not set for this account. Please contact support.', status: 400 };
  }

  // Check OTP send attempts for rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Count OTP sends today for this phone
  const otpSendsToday = await smsModels.countOtpSendsToday(phone_no, today);
  if (otpSendsToday >= 5) {
    return { error: 'OTP send limit reached for today. Please try again tomorrow.', status: 429 };
  }

  // Check last OTP send time for cooldown
  const lastOtpSend = await smsModels.getLastOtpSend(phone_no);
  if (lastOtpSend && new Date(lastOtpSend.attempt_date) > oneMinuteAgo) {
    return { error: 'Please wait at least 1 minute before requesting another OTP.', status: 429 };
  }

  // Generate and send OTP
  const otp = smsServices.generateOtp();
  const sendResult = await smsServices.sendOtp(phone_no, user.email, otp);

  if (!sendResult.success) {
    return { error: sendResult.error || 'Failed to send OTP. Please try again.', status: 500 };
  }

  // Log OTP send attempt
  await smsModels.logOtpSendAttempt(phone_no, user.id);

  return {
    message: 'OTP sent successfully to your phone number.',
    otp: otp, // For testing purposes; remove in production
    status: 200,
    user: {
      id: user.id,
      phone_no: user.phone_no,
      email: user.email
    }
  };
}

// User Reset Password Service - verifies OTP and resets password
export async function userResetPasswordService(phone_no, otp, newPassword, req) {
  // Validate input
  if (!phone_no || !otp || !newPassword) {
    return { error: 'Phone number, OTP, and new password are required.', status: 400 };
  }

  // Validate password strength
  if (newPassword.length < 4) {
    return { error: 'Password must be at least 4 characters long.', status: 400 };
  }

  // Find user by phone number
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'No account found with this phone number.', status: 404 };
  }

  // Verify OTP
  const otpVerification = await smsServices.verifyOtp(phone_no, otp);
  if (!otpVerification.success) {
    return { error: otpVerification.error, status: 400 };
  }

  // Hash new password
  const hashedPassword = await helpers.hashPassword(newPassword);

  // Update user password
  await models.updateUserPassword(user.id, hashedPassword);

  return {
    message: 'Password reset successfully. You can now log in with your new password.',
    status: 200,
    user: {
      id: user.id,
      phone_no: user.phone_no,
      email: user.email
    }
  };
}

// User Resend OTP for Forgot Password Service
export async function userResendForgotPasswordOtpService(phone_no, req) {
  // Validate input
  if (!phone_no) {
    return { error: 'Phone number is required.', status: 400 };
  }

  // Find user by phone number
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'No account found with this phone number.', status: 404 };
  }

  // Check if user has a password set (only allow reset if password exists)
  if (!user.password) {
    return { error: 'Password not set for this account. Please contact support.', status: 400 };
  }

  // Check OTP send attempts for rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Count OTP sends today for this phone
  const otpSendsToday = await smsModels.countOtpSendsToday(phone_no, today);
  if (otpSendsToday >= 5) {
    return { error: 'OTP send limit reached for today. Please try again tomorrow.', status: 429 };
  }

  // Check last OTP send time for cooldown
  const lastOtpSend = await smsModels.getLastOtpSend(phone_no);
  if (lastOtpSend && new Date(lastOtpSend.attempt_date) > oneMinuteAgo) {
    return { error: 'Please wait at least 1 minute before requesting another OTP.', status: 429 };
  }

  // Generate and send new OTP
  const otp = smsServices.generateOtp();
  const sendResult = await smsServices.sendOtp(phone_no, user.email, otp);

  if (!sendResult.success) {
    return { error: sendResult.error || 'Failed to send OTP. Please try again.', status: 500 };
  }

  // Log OTP send attempt
  await smsModels.logOtpSendAttempt(phone_no, user.id);

  return {
    message: 'OTP resent successfully to your phone number.',
    otp: otp, // For testing purposes; remove in production
    status: 200,
    user: {
      id: user.id,
      phone_no: user.phone_no,
      email: user.email
    }
  };
}

// User Resend OTP for Set Password Service
export async function userResendSetPasswordOtpService(phone_no, req) {
  // Validate input
  if (!phone_no) {
    return { error: 'Phone number is required.', status: 400 };
  }

  // Find user by phone number
  const user = await models.findUserByPhone(phone_no);
  if (!user) {
    return { error: 'No account found with this phone number.', status: 404 };
  }

  // Check if user already has a password set
  if (user.password) {
    return { error: 'Password already set for this user.', status: 400 };
  }

  // Check OTP send attempts for rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Count OTP sends today for this phone
  const otpSendsToday = await smsModels.countOtpSendsToday(phone_no, today);
  if (otpSendsToday >= 5) {
    return { error: 'OTP send limit reached for today. Please try again tomorrow.', status: 429 };
  }

  // Check last OTP send time for cooldown
  const lastOtpSend = await smsModels.getLastOtpSend(phone_no);
  if (lastOtpSend && new Date(lastOtpSend.attempt_date) > oneMinuteAgo) {
    return { error: 'Please wait at least 1 minute before requesting another OTP.', status: 429 };
  }

  // Generate and send new OTP
  const otp = smsServices.generateOtp();
  const sendResult = await smsServices.sendOtp(phone_no, user.email, otp);

  if (!sendResult.success) {
    return { error: sendResult.error || 'Failed to send OTP. Please try again.', status: 500 };
  }

  // Log OTP send attempt
  await smsModels.logOtpSendAttempt(phone_no, user.id);

  return {
    message: 'OTP resent successfully to your phone number.',
    otp: otp, // For testing purposes; remove in production
    status: 200,
    user: {
      id: user.id,
      phone_no: user.phone_no,
      email: user.email
    }
  };
}

// Update user profile service with upsert functionality
export async function updateUserProfileService(userId, updateData) {
  try {
    // Validate user exists
    const existingUser = await models.findUserById(userId);
    if (!existingUser) {
      return { error: 'User not found.', status: 404 };
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await models.findUserByEmail(updateData.email);
      if (emailExists) {
        return { error: 'Email address already exists.', status: 409 };
      }
    }

    // Validate phone uniqueness if phone is being updated
    if (updateData.phone_no && updateData.phone_no !== existingUser.phone_no) {
      const phoneExists = await models.findUserByPhone(updateData.phone_no);
      if (phoneExists) {
        return { error: 'Phone number already exists.', status: 409 };
      }
    }

    // Update user profile (only profile fields, no terms agreement)
    await models.updateUserProfile(userId, updateData);

    // Fetch updated user data
    const updatedUser = await models.findUserById(userId);

    return {
      user: {
        id: updatedUser.id,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phone_no: updatedUser.phone_no,
        address: updatedUser.address,
        gstin: updatedUser.gstin,
        role_id: updatedUser.role_id,
        terms_agreed: updatedUser.terms_agreed,
        terms_agreed_at: updatedUser.terms_agreed_at
      },
      status: 200
    };
  } catch (error) {
    console.error('Error in updateUserProfileService:', error);
    return { error: 'Failed to update profile.', status: 500 };
  }
}

// Agree to terms and conditions service
export async function agreeTermsAndConditionsService(userId) {
  try {
    // Validate user exists
    const existingUser = await models.findUserById(userId);
    if (!existingUser) {
      return { error: 'User not found.', status: 404 };
    }

    // Update terms agreement
    const updateData = {
      terms_agreed: true,
      terms_agreed_at: new Date()
    };

    await models.updateUserProfile(userId, updateData);

    // Fetch updated user data
    const updatedUser = await models.findUserById(userId);

    return {
      user: {
        id: updatedUser.id,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phone_no: updatedUser.phone_no,
        address: updatedUser.address,
        gstin: updatedUser.gstin,
        role_id: updatedUser.role_id,
        terms_agreed: updatedUser.terms_agreed,
        terms_agreed_at: updatedUser.terms_agreed_at
      },
      status: 200
    };
  } catch (error) {
    console.error('Error in agreeTermsAndConditionsService:', error);
    return { error: 'Failed to agree to terms and conditions.', status: 500 };
  }
}

// View user profile service
export async function viewUserProfileService(userId) {
  try {
    // Fetch user details
    const user = await models.findUserById(userId);
    if (!user) {
      return { error: 'User not found.', status: 404 };
    }

    // Return user profile data excluding sensitive fields
    return {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone_no: user.phone_no,
        address: user.address,
        gstin: user.gstin,
        profile_photo: user.profile_photo,
        role_id: user.role_id,
        terms_agreed: user.terms_agreed,
        terms_agreed_at: user.terms_agreed_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      status: 200
    };
  } catch (error) {
    console.error('Error in viewUserProfileService:', error);
    return { error: 'Failed to retrieve user profile.', status: 500 };
  }
}

// Get active devices/sessions for a user
export async function getActiveDevicesService(userId) {
  try {
    const sessions = await models.getActiveSessionsByUserId(userId);

    // Format the device information for response
    const devices = sessions.map(session => ({
      id: session.id,
      device_name: session.device_name || 'Unknown Device',
      browser: session.browser || 'Unknown',
      browser_version: session.browser_version || '',
      os: session.os || 'Unknown',
      os_version: session.os_version || '',
      device_type: session.device_type || 'desktop',
      location: session.location || 'Unknown',
      ip_address: session.ip_address,
      is_current_session: session.is_current_session || false,
      last_activity: session.last_activity || session.created_at,
      created_at: session.created_at
    }));

    return {
      devices,
      total: devices.length,
      status: 200
    };
  } catch (error) {
    console.error('Error in getActiveDevicesService:', error);
    return { error: 'Failed to retrieve active devices.', status: 500 };
  }
}

// Logout from specific device/session
export async function logoutFromDeviceService(userId, sessionId) {
  try {
    // Verify the session belongs to the user
    const session = await knex('byt_user_sessions')
      .where({ id: sessionId, user_id: userId })
      .first();

    if (!session) {
      return { error: 'Device session not found.', status: 404 };
    }

    // Delete the specific session
    await models.deleteSessionByUserIdAndSessionId(userId, sessionId);

    return {
      message: 'Successfully logged out from the selected device.',
      status: 200
    };
  } catch (error) {
    console.error('Error in logoutFromDeviceService:', error);
    return { error: 'Failed to logout from device.', status: 500 };
  }
}

// Logout from all devices except current session
export async function logoutFromAllDevicesService(userId, currentSessionId) {
  try {
    // Delete all sessions for the user except the current one
    await knex('byt_user_sessions')
      .where({ user_id: userId })
      .andWhereNot({ id: currentSessionId })
      .del();

    return {
      message: 'Successfully logged out from all other devices.',
      status: 200
    };
  } catch (error) {
    console.error('Error in logoutFromAllDevicesService:', error);
    return { error: 'Failed to logout from all devices.', status: 500 };
  }
}
