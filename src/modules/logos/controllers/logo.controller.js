import * as services from '../services/logo.services.js';
import { deleteFromFTP, extractPublicIdFromUrl, isFTPUrl } from '../../../config/ftp.js';

// Get all logos
export async function getAllLogos(req, res) {
  try {
    const result = await services.getAllLogosService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ 
      statusCode: result.status, 
      logos: result.logos
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Upload logos
export async function uploadLogos(req, res) {
  try {
    // Check if metadata is provided
    if (!req.body || !req.body.fileName) {
      return res.status(400).json({ statusCode: 400, error: 'No file metadata provided' });
    }

    const result = await services.uploadLogosService(req.body);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    res.status(result.status).json({ 
      statusCode: result.status, 
      message: result.message,
      logos: result.logos
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete logo by ID
export async function deleteLogo(req, res) {
  try {
    const { id } = req.params;
    
    // Get the existing logo to check if there's an image to remove from FTP
    const existingLogo = await services.getLogoByIdService(id);
    
    const result = await services.deleteLogoService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    // If the deletion was successful and there was an image, remove the image from FTP
    if (existingLogo.logo && existingLogo.logo.file_path) {
      // Check if it's an FTP URL
      if (isFTPUrl(existingLogo.logo.file_path)) {
        const publicId = extractPublicIdFromUrl(existingLogo.logo.file_path);
        if (publicId) {
          try {
            await deleteFromFTP(publicId);
          } catch (ftpError) {
            console.error('Failed to delete from FTP:', ftpError);
            // Continue with the response even if FTP deletion fails
          }
        }
      }
    }
    
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
