import * as services from '../services/logo.services.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    
    // Get the existing logo to check if there's an image to remove
    const existingLogo = await services.getLogoByIdService(id);
    
    const result = await services.deleteLogoService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    // If the deletion was successful and there was an image, remove the image file
    if (existingLogo.logo && existingLogo.logo.file_path) {
      const frontendPublicPath = path.join(__dirname, '../../../../../frontend/public');
      const imagePath = path.join(frontendPublicPath, existingLogo.logo.file_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
