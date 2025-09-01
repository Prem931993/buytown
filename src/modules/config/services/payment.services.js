import * as models from '../models/payment.models.js';

export async function createPaymentConfiguration(data) {
  try {
    const config = await models.createPaymentConfiguration(data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentConfiguration(gatewayName) {
  try {
    const config = await models.getPaymentConfiguration(gatewayName);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllPaymentConfigurations() {
  try {
    const configs = await models.getAllPaymentConfigurations();
    return { success: true, configs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updatePaymentConfiguration(id, data) {
  try {
    const config = await models.updatePaymentConfiguration(id, data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deletePaymentConfiguration(id) {
  try {
    await models.deletePaymentConfiguration(id);
    return { success: true, message: 'Payment configuration deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
