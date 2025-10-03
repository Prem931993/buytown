import * as services from '../services/delivery-person.services.js';
import { uploadToCloudinary } from '../../../config/cloudinary.js';

export async function getDeliveryPersonProfile(req, res) {
  try {
    const deliveryPersonId = req.user.id; // Get from authenticated user
    const result = await services.getDeliveryPersonProfile(deliveryPersonId);

    if (result.success) {
      res.json({
        success: true,
        data: result.profile
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function updateDeliveryPersonProfile(req, res) {
  try {
    const deliveryPersonId = req.user.id; // Get from authenticated user
    let profileData = req.body;

    // Parse vehicles if it's a JSON string
    if (profileData.vehicles && typeof profileData.vehicles === 'string') {
      try {
        profileData.vehicles = JSON.parse(profileData.vehicles);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vehicles data format'
        });
      }
    }

    // Handle file upload for driving license if present
    if (req.file) {
      // Upload to Cloudinary with proper resource type for PDF
      const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'auto';
      const result = await uploadToCloudinary(req.file.buffer, 'delivery-person', resourceType);
      profileData.license = result.secure_url;
    }

    const result = await services.updateDeliveryPersonProfile(deliveryPersonId, profileData);

    if (result.success) {
      res.json({
        success: true,
        data: result.profile,
        message: 'Profile updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAvailableVehicles(req, res) {
  try {
    const result = await services.getAvailableVehicles();

    if (result.success) {
      res.json({
        success: true,
        data: result.vehicles
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
