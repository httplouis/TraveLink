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
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.ok) {
        // Transform API data to ProfilePage format
        const transformed = {
          name: data.data.name || `${data.data.firstName} ${data.data.lastName}`.trim(),
          email: data.data.email,
          phone_number: data.data.phone,
          department: data.data.department,
          position_title: data.data.position_title,
          employee_id: data.data.employeeId,
          bio: data.data.bio,
          profile_picture: data.data.avatarUrl || data.data.profile_picture,
          roles: {
            is_user: true,
            is_head: data.data.is_head,
            is_admin: data.data.is_admin,
            is_comptroller: data.data.is_comptroller,
            is_hr: data.data.is_hr,
            is_executive: data.data.is_executive
          }
        };
        setProfileData(transformed);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' '),
        phone: data.phone_number,
        avatarUrl: data.profile_picture
      })
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to save profile');
    }

    // Update local state
    setProfileData(data);
    toast.success('Profile updated successfully');
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
