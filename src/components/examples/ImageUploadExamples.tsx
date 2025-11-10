'use client';

/**
 * EXAMPLES: How to use ImageUpload component with Supabase Storage
 * Copy these examples to your actual forms/pages
 */

import ImageUpload from '@/components/common/ImageUpload';
import { 
  uploadProfilePicture, 
  uploadSignature, 
  uploadMaintenancePhoto 
} from '@/lib/storage/supabase-storage';

// ============================================
// EXAMPLE 1: Profile Picture Upload
// ============================================
export function ProfilePictureExample({ userId }: { userId: string }) {
  const handleProfileUpload = async (file: File) => {
    // Upload to Supabase Storage
    const result = await uploadProfilePicture(userId, file);
    
    if (!result.error) {
      // TODO: Save URL to database
      console.log('Profile picture uploaded:', result.url);
      
      // Example API call to save to database:
      // await fetch('/api/users/profile', {
      //   method: 'PATCH',
      //   body: JSON.stringify({ avatar_url: result.url })
      // });
    }
    
    return result;
  };

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
      <ImageUpload
        onUpload={handleProfileUpload}
        label="Upload Profile Photo"
        currentImageUrl="/default-avatar.png"
        maxSizeMB={5}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 2: Signature Upload
// ============================================
export function SignatureExample({ userId }: { userId: string }) {
  const handleSignatureUpload = async (file: File) => {
    const result = await uploadSignature(userId, file);
    
    if (!result.error) {
      console.log('Signature uploaded:', result.url);
      
      // Save to database
      // await updateUserSignature(userId, result.url);
    }
    
    return result;
  };

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-4">Digital Signature</h3>
      <ImageUpload
        onUpload={handleSignatureUpload}
        label="Upload Signature"
        accept="image/png,image/jpeg"
        maxSizeMB={2}
      />
      <p className="text-xs text-gray-500 mt-2">
        Upload a clear image of your signature on white background
      </p>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Maintenance Photo Upload
// ============================================
export function MaintenancePhotoExample({ vehicleId }: { vehicleId: string }) {
  const handleMaintenanceUpload = async (file: File) => {
    const result = await uploadMaintenancePhoto(vehicleId, file);
    
    if (!result.error) {
      console.log('Maintenance photo uploaded:', result.url);
      
      // Save to maintenance_records table
      // await fetch('/api/maintenance/photos', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     vehicle_id: vehicleId,
      //     photo_url: result.url,
      //     description: 'Maintenance photo'
      //   })
      // });
    }
    
    return result;
  };

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-4">Maintenance Photo</h3>
      <ImageUpload
        onUpload={handleMaintenanceUpload}
        label="Upload Maintenance Photo"
        maxSizeMB={10}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 4: Multiple Images (Gallery)
// ============================================
export function MaintenanceGalleryExample({ vehicleId }: { vehicleId: string }) {
  const handleUpload = async (file: File) => {
    return await uploadMaintenancePhoto(vehicleId, file);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Maintenance Photo Gallery</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <ImageUpload
          onUpload={handleUpload}
          label="Before Photo"
          maxSizeMB={10}
        />
        <ImageUpload
          onUpload={handleUpload}
          label="After Photo"
          maxSizeMB={10}
        />
      </div>
    </div>
  );
}

// ============================================
// HOW TO USE IN YOUR PAGES:
// ============================================
/*

// 1. In a profile page:
import { ProfilePictureExample } from '@/components/examples/ImageUploadExamples';

export default function ProfilePage() {
  const userId = 'user-123'; // Get from auth/session
  
  return (
    <div>
      <ProfilePictureExample userId={userId} />
    </div>
  );
}

// 2. In a maintenance form:
import { MaintenancePhotoExample } from '@/components/examples/ImageUploadExamples';

export default function MaintenancePage() {
  const vehicleId = 'vehicle-456';
  
  return (
    <div>
      <MaintenancePhotoExample vehicleId={vehicleId} />
    </div>
  );
}

// 3. Custom implementation:
import ImageUpload from '@/components/common/ImageUpload';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage/supabase-storage';

function MyCustomForm() {
  const handleCustomUpload = async (file: File) => {
    return await uploadImage(
      STORAGE_BUCKETS.DOCUMENTS,
      file,
      'my-folder/custom-name.jpg'
    );
  };

  return (
    <ImageUpload
      onUpload={handleCustomUpload}
      label="Upload Document"
    />
  );
}

*/
