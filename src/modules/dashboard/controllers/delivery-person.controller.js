import * as services from '../services/delivery-person.services.js';
import { uploadToFTP } from '../../../config/ftp.js';

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
      const fileExtension = originalName.split('.').pop()?.toLowerCase();

      // Determine resource type based on file extension and mime type
      let resourceType = 'auto'; // Default

      // Check for image files
      if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
        resourceType = 'image';
      }
      // Check for video files
      else if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(fileExtension)) {
        resourceType = 'video';
      }
      // Check for PDF files
      else if (mime === 'application/pdf' || fileExtension === 'pdf') {
        resourceType = 'raw';
      }
      // Check for document files
      else if (
        ['doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension) ||
        mime === 'application/msword' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'text/plain' ||
        mime === 'application/rtf' ||
        mime.includes('document') ||
        mime.includes('text')
      ) {
        resourceType = 'raw';
      }
      // Default to raw for other file types
      else {
        resourceType = 'raw';
      }

      let uploadResult;
      if (req.file.buffer) {
        // Multer memoryStorage
        uploadResult = await uploadToFTP(req.file.buffer, 'delivery-person', resourceType);
      } else if (req.file.path) {
        // Multer diskStorage
        uploadResult = await uploadToFTP(req.file.path, 'delivery-person', resourceType);
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
