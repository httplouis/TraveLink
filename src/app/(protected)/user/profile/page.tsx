"use client";

import { useState, useEffect } from 'react';
import ProfilePageComponent from '@/components/profile/ProfilePage';
import { useToast } from '@/components/common/ui/Toast';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // First, try to force update if name is missing
      const currentResponse = await fetch('/api/profile');
      const currentData = await currentResponse.json();
      
      if (currentData.ok && (!currentData.data.name || currentData.data.name === currentData.data.email?.split("@")[0])) {
        // Name is missing or just email prefix, try to force update
        console.log('[ProfilePage] Name missing, attempting force update...');
        try {
          await fetch('/api/profile/force-update', { method: 'POST' });
          // Wait a bit for update to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (updateError) {
          console.warn('[ProfilePage] Force update failed:', updateError);
        }
      }
      
      // Fetch profile again after potential update
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.ok) {
        // Transform API data to ProfilePage format
        const transformed = {
          name: data.data.name || `${data.data.firstName} ${data.data.lastName}`.trim() || data.data.email?.split("@")[0] || "User",
          email: data.data.email,
          phone_number: data.data.phone || null,
          department: data.data.department || null, // Now returns department name
          position_title: data.data.position_title || null, // Now includes position_title
          employee_id: data.data.employeeId || data.data.id,
          bio: data.data.bio || null,
          profile_picture: data.data.avatarUrl || data.data.profile_picture || null,
          roles: {
            is_user: true,
            is_head: data.data.is_head || false,
            is_admin: data.data.is_admin || false,
            is_comptroller: data.data.is_comptroller || false,
            is_hr: data.data.is_hr || false,
            is_executive: data.data.is_executive || false
          }
        };
        console.log('[ProfilePage] Transformed data:', transformed);
        setProfileData(transformed);
      } else {
        console.error('[ProfilePage] API error:', data.error);
        toast.error(data.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, // Send full name
          phone_number: data.phone_number || null,
          department: data.department || null,
          position_title: data.position_title || null,
          // Note: employee_id is NOT sent - it's read-only, managed by admins
          bio: data.bio || null,
          profile_picture: data.profile_picture || null,
        })
      });

      const result = await response.json();
      if (!result.ok) {
        console.error('[ProfilePage] Save error:', result.error);
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update local state
      setProfileData(data);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('[ProfilePage] Save failed:', error);
      toast.error(error.message || 'Failed to save profile. Please try again.');
      throw error; // Re-throw to let component handle it
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Upload to Supabase storage
    const response = await fetch('/api/upload/profile-picture', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to upload image');
    }

    return result.url;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-slate-600">Failed to load profile. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <ProfilePageComponent
      initialData={profileData}
      onSave={handleSave}
      onUploadImage={handleUploadImage}
      isEditable={true}
    />
  );
}
