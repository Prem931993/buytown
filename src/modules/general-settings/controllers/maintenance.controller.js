import * as generalSettingsService from '../services/generalSettings.services.js';

export const getMaintenanceMode = async (req, res) => {
  try {
    const settings = await generalSettingsService.getSettings();
    const maintenanceMode = settings ? settings.maintenance_mode || false : false;

    res.status(200).json({
      success: true,
      data: {
        maintenance_mode: maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const setMaintenanceMode = async (req, res) => {
  try {
    const { maintenance_mode } = req.body;

    if (typeof maintenance_mode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'maintenance_mode must be a boolean value'
      });
    }

    const settings = await generalSettingsService.updateSettings({
      maintenance_mode: maintenance_mode
    });

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${maintenance_mode ? 'enabled' : 'disabled'} successfully`,
      data: {
        maintenance_mode: settings.maintenance_mode
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
