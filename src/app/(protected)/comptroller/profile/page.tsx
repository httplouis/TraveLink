"use client";

import { useState, useEffect } from 'react';
import ProfilePageComponent from '@/components/profile/ProfilePage';
import { useToast } from '@/components/common/ui/Toast';

export default function ComptrollerProfilePage() {
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
      if (!currentResponse.ok) {
        console.warn('[ComptrollerProfilePage] Profile API not OK:', currentResponse.status);
        toast.error('Failed to load profile');
        return;
      }
      const currentContentType = currentResponse.headers.get("content-type");
      if (!currentContentType || !currentContentType.includes("application/json")) {
        console.error('[ComptrollerProfilePage] Profile API returned non-JSON response. Content-Type:', currentContentType);
        toast.error('Invalid response format');
        return;
      }
      const currentData = await currentResponse.json();
      
      if (currentData.ok && (!currentData.data.name || currentData.data.name === currentData.data.email?.split("@")[0])) {
        // Name is missing or just email prefix, try to force update
        console.log('[ComptrollerProfilePage] Name missing, attempting force update...');
        try {
          await fetch('/api/profile/force-update', { method: 'POST' });
          // Wait a bit for update to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (updateError) {
          console.warn('[ComptrollerProfilePage] Force update failed:', updateError);
        }
      }
      
      // Fetch profile again after potential update
      const response = await fetch('/api/profile');
      if (!response.ok) {
        console.error('[ComptrollerProfilePage] Profile API not OK:', response.status);
        toast.error('Failed to load profile');
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('[ComptrollerProfilePage] Profile API returned non-JSON response. Content-Type:', contentType);
        toast.error('Invalid response format');
        return;
      }
      const data = await response.json();
      
      if (!data.ok) {
        console.error('[ComptrollerProfilePage] Profile API error:', data.error);
        toast.error(data.error || 'Failed to load profile');
        return;
      }

      // Map API response to ProfilePage component format
      const mappedData = {
        name: data.data.name || data.data.email?.split("@")[0] || "Comptroller",
        email: data.data.email || "",
        phone_number: data.data.phone_number || "",
        department: data.data.department || "",
        position_title: data.data.position_title || "",
        employee_id: data.data.employee_id || "",
        bio: data.data.bio || "",
        profile_picture: data.data.profile_picture || data.data.avatarUrl || null,
        exec_type: data.data.exec_type || null,
        roles: {
          is_user: data.data.role === "faculty" || data.data.is_user,
          is_head: data.data.is_head || false,
          is_admin: data.data.role === "admin" || data.data.is_admin || false,
          is_comptroller: data.data.role === "comptroller" || data.data.is_comptroller || false,
          is_hr: data.data.is_hr || false,
          is_executive: data.data.is_exec || false,
          is_vp: data.data.is_vp || false,
          is_president: data.data.is_president || false,
        },
      };

      setProfileData(mappedData);
    } catch (error: any) {
      console.error('[ComptrollerProfilePage] Error fetching profile:', error);
      toast.error('Failed to load profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData: any) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          phone_number: updatedData.phone_number || null,
          position_title: updatedData.position_title || null,
          employee_id: updatedData.employee_id || null,
          bio: updatedData.bio || null,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          throw new Error(`Failed to save: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response");
      }
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update local state
      setProfileData((prev: any) => ({
        ...prev,
        ...updatedData,
      }));

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('[ComptrollerProfilePage] Save failed:', error);
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ComptrollerProfilePage] Upload API error:', response.status, errorText.substring(0, 200));
      throw new Error(`Failed to upload: ${response.status}`);
    }
    const uploadContentType = response.headers.get("content-type");
    if (!uploadContentType || !uploadContentType.includes("application/json")) {
      const errorText = await response.text();
      console.error('[ComptrollerProfilePage] Upload API returned non-JSON. Response:', errorText.substring(0, 200));
      throw new Error("API returned non-JSON response");
    }
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

