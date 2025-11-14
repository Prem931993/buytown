export const validateRegisterInput = ({ firstname, lastname, email, phone_no, password, role, gstin, address }) => {
  // Only require role and either email or phone number
  if (!role || (!email && !phone_no)) {
    return 'Role and either email or phone number are required.';
  }
  // Only require password for admin (role === 'admin')
  if (role === 'admin' && !password) {
    return 'Password is required for admin.';
  }
  // firstname, lastname, gstin, and address are optional
  return null;
};

export const validateLoginInput = ({ identity, password }) => {
  if (!identity || !password) {
    return 'Both identity (email or phone number) and password are required.';
  }
  return null;
};

export const validateForgotPasswordInput = ({ identity }) => {
  if (!identity) return 'Identity (email or phone number) is required.';
  return null;
};

export const validateResetPasswordInput = ({ token, newPassword }) => {
  if (!token || !newPassword) return 'Token and new password are required.';
  return null;
};

export const validateApiTokenInput = ({ client_id, client_secret }) => {
  if (!client_id || !client_secret) {
    return 'Both client_id and client_secret are required.';
  }
  return null;
};

export const validateChangePasswordInput = ({ old_password, new_password }) => {
  if (!old_password || !new_password) {
    return 'Both old password and new password are required.';
  }
  if (new_password.length < 4) {
    return 'New password must be at least 4 characters long.';
  }
  if (old_password === new_password) {
    return 'New password must be different from the old password.';
  }
  return null;
};
