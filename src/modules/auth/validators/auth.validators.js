export const validateRegisterInput = ({ username, email, phone_no, password, role_id, gstin, address }) => {
  if (!username || (!email && !phone_no) || !role_id) {
    return 'Username, role, and either email or phone number are required.';
  }
  // Only require password for admin (role_id === 1)
  if (Number(role_id) === 1 && !password) {
    return 'Password is required for admin.';
  }
  // gstin and address are optional, no validation needed
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