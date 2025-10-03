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
    const deliveryPersonId = req.user.id; 
    let profileData = req.body;

    // Parse vehicles if sent as JSON string
    if (profileData.vehicles && typeof profileData.vehicles === 'string') {
      try {
        profileData.vehicles = JSON.parse(profileData.vehicles);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid vehicles data format' });
      }
    }

    // Handle license file
    if (req.file) {
      const mime = req.file.mimetype || '';
      const originalName = req.file.originalname || '';

      // Validate that the file is a PDF
      const isPdfMime = mime === 'application/pdf';
      const isPdfExtension = originalName.toLowerCase().endsWith('.pdf');

      if (!isPdfMime && !isPdfExtension) {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed for license upload'
        });
      }

      // Force resource_type to 'raw' for PDF files
      const resourceType = 'raw';

      let uploadResult;
      if (req.file.buffer) {
        // Multer memoryStorage
        uploadResult = await uploadToCloudinary(req.file.buffer, 'delivery-person', resourceType);
      } else if (req.file.path) {
        // Multer diskStorage
        uploadResult = await uploadToCloudinary(req.file.path, 'delivery-person', resourceType);
      }

      if (uploadResult?.secure_url) {
        profileData.license = uploadResult.secure_url;
      }
    }

    const result = await services.updateDeliveryPersonProfile(deliveryPersonId, profileData);

    if (result.success) {
      return res.json({
        success: true,
        data: result.profile,
        message: 'Profile updated successfully'
      });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
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
