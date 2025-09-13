
import * as generalSettingsService from '../services/generalSettings.services.js';
import * as logoService from '../../logos/services/logo.services.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await generalSettingsService.getSettings();
    // Parse selected_categories if it exists
    if (settings && settings.selected_categories) {
      try {
        // Handle different data formats
        if (typeof settings.selected_categories === 'string') {
          settings.selected_categories = JSON.parse(settings.selected_categories);
        } else if (Array.isArray(settings.selected_categories)) {
          // Already an array, no need to parse
        } else {
          // Invalid format, reset to empty array
          settings.selected_categories = [];
        }
      } catch (parseError) {
        console.error('Error parsing selected_categories:', parseError);
        console.error('Raw value:', settings.selected_categories);
        settings.selected_categories = [];
      }
    } else {
      settings.selected_categories = [];
    }
    res.status(200).json({
      success: true,
      data: settings || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    const settings = await generalSettingsService.updateSettings(settingsData);
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getGeneralSettingsWithLogos = async (req, res) => {
  try {
    const settings = await generalSettingsService.getSettings();
    const logosResult = await logoService.getAllLogosService();

    const logos = logosResult.logos || [];

    // Parse selected_categories if it exists
    let selectedCategoryIds = [];
    if (settings && settings.selected_categories) {
      try {
        // Handle different data formats
        if (typeof settings.selected_categories === 'string') {
          selectedCategoryIds = JSON.parse(settings.selected_categories);
        } else if (Array.isArray(settings.selected_categories)) {
          // Check if it's an array of objects with id or just ids
          selectedCategoryIds = settings.selected_categories.map(cat =>
            typeof cat === 'object' && cat.id ? cat.id : cat
          );
        } else {
          // Invalid format, reset to empty array
          selectedCategoryIds = [];
        }
      } catch (parseError) {
        console.error('Error parsing selected_categories:', parseError);
        console.error('Raw value:', settings.selected_categories);
        selectedCategoryIds = [];
      }
    }

    // Fetch full category details for selected categories
    let selectedCategories = [];
    if (selectedCategoryIds.length > 0) {
      selectedCategories = await generalSettingsService.getCategoriesByIds(selectedCategoryIds);
    }

    res.status(200).json({
      success: true,
      data: {
        ...settings,
        selected_categories: selectedCategories,
        logos
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
