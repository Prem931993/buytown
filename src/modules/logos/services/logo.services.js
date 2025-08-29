import * as models from '../models/logo.models.js';
import knex from '../../../config/db.js';

// Get all logos
export async function getAllLogosService() {
  try {
    const logos = await models.getAllLogos();
    return { logos, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Upload logos
export async function uploadLogosService(metadata) {
  try {
    const logos = [];
    
    // Process each file metadata
    const logoData = {
      name: metadata.fileName,
      file_path: metadata.filePath // Use the actual uploaded file path
    };
    
    const logo = await models.createLogo(logoData);
    logos.push(logo);
    
    return { 
      logos, 
      message: `Logo uploaded successfully`,
      status: 201 
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get logo by ID
export async function getLogoByIdService(id) {
  try {
    const logo = await models.getLogoById(id);
    if (!logo) {
      return { error: 'Logo not found', status: 404 };
    }
    return { logo, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete logo by ID
export async function deleteLogoService(id) {
  try {
    // Check if logo exists
    const existingLogo = await models.getLogoById(id);
    if (!existingLogo) {
      return { error: 'Logo not found', status: 404 };
    }

    await models.deleteLogo(id);
    return { message: 'Logo deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}