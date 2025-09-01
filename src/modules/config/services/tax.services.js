import * as models from '../models/tax.models.js';

export async function createTaxConfiguration(data) {
  try {
    const config = await models.createTaxConfiguration(data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTaxConfiguration(id) {
  try {
    const config = await models.getTaxConfiguration(id);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllTaxConfigurations() {
  try {
    const configs = await models.getAllTaxConfigurations();
    return { success: true, configs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateTaxConfiguration(id, data) {
  try {
    const config = await models.updateTaxConfiguration(id, data);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteTaxConfiguration(id) {
  try {
    await models.deleteTaxConfiguration(id);
    return { success: true, message: 'Tax configuration deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
