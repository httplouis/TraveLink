/**
 * Supabase Storage Helper Functions
 * For uploading images (profiles, signatures, maintenance photos, etc.)
 */

import { supabase } from '@/lib/supabaseClient';

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILES: 'profiles',           // User profile pictures
  SIGNATURES: 'signatures',       // Digital signatures
  MAINTENANCE: 'maintenance',     // Vehicle maintenance photos
  DOCUMENTS: 'documents',         // Other documents
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Upload an image to Supabase Storage
 * @param bucket - Storage bucket name
 * @param file - File to upload
 * @param path - Optional path within bucket (e.g., 'user-123/avatar.jpg')
 * @returns Public URL of uploaded file
 */
export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  path?: string
): Promise<{ url: string; path: string; error?: string }> {
  try {
    
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: '', path: '', error: 'File must be an image' };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { url: '', path: '', error: 'File size must be less than 5MB' };
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - Path to file in bucket
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

/**
 * Upload profile picture
 * @param userId - User ID
 * @param file - Image file
 */
export async function uploadProfilePicture(userId: string, file: File) {
  const path = `${userId}/avatar.jpg`;
  return uploadImage(STORAGE_BUCKETS.PROFILES, file, path);
}

/**
 * Upload signature image
 * @param userId - User ID
 * @param file - Signature image file
 */
export async function uploadSignature(userId: string, file: File) {
  const path = `${userId}/signature.png`;
  return uploadImage(STORAGE_BUCKETS.SIGNATURES, file, path);
}

/**
 * Upload maintenance photo
 * @param vehicleId - Vehicle ID
 * @param file - Maintenance photo
 */
export async function uploadMaintenancePhoto(vehicleId: string, file: File) {
  const timestamp = Date.now();
  const path = `${vehicleId}/${timestamp}-${file.name}`;
  return uploadImage(STORAGE_BUCKETS.MAINTENANCE, file, path);
}

/**
 * Get public URL for stored file
 * @param bucket - Storage bucket name
 * @param path - Path to file in bucket
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
