import * as generalSettingsModel from '../models/generalSettings.models.js';

export const getSettings = async () => {
  return await generalSettingsModel.getSettings();
};

export const updateSettings = async (settingsData) => {
  // Validate required fields if needed
  // Handle selected_categories array to store in DB as JSON or string
  if (settingsData.selected_categories !== undefined) {
    if (Array.isArray(settingsData.selected_categories)) {
      settingsData.selected_categories = JSON.stringify(settingsData.selected_categories);
    } else {
      settingsData.selected_categories = JSON.stringify([]);
    }
  }
  return await generalSettingsModel.upsertSettings(settingsData);
};

export const getCategoriesByIds = async (categoryIds) => {
  return await generalSettingsModel.getCategoriesByIds(categoryIds);
};
