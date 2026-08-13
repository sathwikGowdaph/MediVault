import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary from Environment Variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  cloudinary.config({ cloudinary_url: cloudinaryUrl });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

/**
 * Returns true if valid Cloudinary credentials are set up in env.
 */
export function isCloudinaryConfigured() {
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

/**
 * Uploads a file (PDF, PNG, JPG, WEBP) to Cloudinary.
 * @param {string} filePath - Absolute path to local file
 * @param {Object} options - Custom upload options (folder, mimeType, etc.)
 */
export async function uploadToCloudinary(filePath, options = {}) {
  const folder = options.folder || process.env.CLOUDINARY_FOLDER || 'medivault_records';
  const mimeType = options.mimeType || '';

  // Determine resource type: 'raw' for PDF documents to preserve exact file structure, 'image' for images
  let resourceType = 'auto';
  if (mimeType.toLowerCase() === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    resourceType = 'raw';
  } else if (mimeType.startsWith('image/')) {
    resourceType = 'image';
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      url: result.url,
      format: result.format || (resourceType === 'raw' ? 'pdf' : 'png'),
      resourceType: result.resource_type || resourceType,
      bytes: result.bytes,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('[Cloudinary Upload Error]:', error.message);
    throw new Error(`Cloudinary Upload Failed: ${error.message}`);
  }
}

/**
 * Deletes a file resource from Cloudinary by public ID.
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image', 'raw', or 'auto'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId) return { result: 'not_found' };

  try {
    // Try primary resource type first
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result !== 'ok' && resourceType !== 'raw') {
      // Fallback try as raw
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
    return result;
  } catch (error) {
    console.error(`[Cloudinary Destroy Error for ${publicId}]:`, error.message);
    return { result: 'error', error: error.message };
  }
}

/**
 * Generates a secure transformation/download URL for a Cloudinary asset.
 */
export function getCloudinaryUrl(publicId, options = {}) {
  if (!publicId) return null;
  return cloudinary.url(publicId, { secure: true, ...options });
}

export default {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl
};
