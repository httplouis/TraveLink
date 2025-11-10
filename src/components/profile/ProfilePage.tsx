"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Mail, Phone, Building, Hash, FileText, Save, X, Check } from "lucide-react";
import { pageVariants, successCheckVariants } from "@/lib/animations";
import StatusBadge from "../common/StatusBadge";

interface ProfileData {
  name: string;
  email: string;
  phone_number?: string;
  department?: string;
  position_title?: string;
  employee_id?: string;
  bio?: string;
  profile_picture?: string | null;
  roles?: {
    is_user?: boolean;
    is_head?: boolean;
    is_admin?: boolean;
    is_comptroller?: boolean;
    is_hr?: boolean;
    is_executive?: boolean;
  };
}

interface ProfilePageProps {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  isEditable?: boolean;
}

export default function ProfilePage({
  initialData,
  onSave,
  onUploadImage,
  isEditable = true,
}: ProfilePageProps) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const imageUrl = await onUploadImage(file);
      setProfileData({ ...profileData, profile_picture: imageUrl });
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(profileData);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(initialData);
    setImagePreview(null);
    setIsEditing(false);
  };

  const getRoleBadges = () => {
    const roles = [];
    if (profileData.roles?.is_executive) roles.push({ label: "Executive", color: "purple" });
    if (profileData.roles?.is_hr) roles.push({ label: "HR", color: "indigo" });
    if (profileData.roles?.is_comptroller) roles.push({ label: "Comptroller", color: "blue" });
    if (profileData.roles?.is_admin) roles.push({ label: "Admin", color: "cyan" });
    if (profileData.roles?.is_head) roles.push({ label: "Department Head", color: "teal" });
    if (profileData.roles?.is_user) roles.push({ label: "Faculty/Staff", color: "gray" });
    return roles;
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover with gradient */}
        <div className="h-32 bg-gradient-to-r from-[#7a0019] to-[#5a0012]" />

        <div className="px-8 pb-8">
          {/* Profile Picture */}
          <div className="flex items-end justify-between -mt-16 mb-6">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img
                  src={imagePreview || profileData.profile_picture || generateAvatar(profileData.name)}
                  alt={profileData.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
                {isEditable && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="
                      absolute bottom-0 right-0
                      w-10 h-10 rounded-full
                      bg-[#7a0019] text-white
                      flex items-center justify-center
                      shadow-lg hover:bg-[#5a0012]
                      transition-colors
                    "
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Edit/Save Buttons */}
            {isEditable && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="
                      px-4 py-2 rounded-lg
                      bg-[#7a0019] text-white font-medium
                      hover:bg-[#5a0012] transition-colors
                    "
                  >
                    Edit Profile
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      className="
                        px-4 py-2 rounded-lg
                        bg-gray-200 text-gray-800 font-medium
                        hover:bg-gray-300 transition-colors
                      "
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      className="
                        px-4 py-2 rounded-lg
                        bg-[#7a0019] text-white font-medium
                        hover:bg-[#5a0012] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 inline mr-1" />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Name and Position */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{profileData.name}</h1>
            <p className="text-lg text-gray-600">
              {profileData.position_title}
              {profileData.department && `, ${profileData.department}`}
            </p>
          </div>

          {/* Role Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {getRoleBadges().map((role) => (
              <span
                key={role.label}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium border
                  bg-${role.color}-100 text-${role.color}-800 border-${role.color}-200
                `}
              >
                {role.label}
              </span>
            ))}
          </div>

          {/* Save Success Message */}
          {saveSuccess && (
            <motion.div
              variants={successCheckVariants}
              initial="hidden"
              animate="visible"
              className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2"
            >
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Profile updated successfully!
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="
                w-full px-4 py-2 rounded-lg border-2 border-gray-200
                bg-gray-50 text-gray-600 cursor-not-allowed
              "
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone_number || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, phone_number: e.target.value })
              }
              disabled={!isEditing}
              placeholder="+63 XXX XXX XXXX"
              className={`
                w-full px-4 py-2 rounded-lg border-2
                ${isEditing 
                  ? "border-gray-200 focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20" 
                  : "border-gray-200 bg-gray-50"
                }
                transition-all outline-none
              `}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Department/Office
            </label>
            <input
              type="text"
              value={profileData.department || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, department: e.target.value })
              }
              disabled={!isEditing}
              className={`
                w-full px-4 py-2 rounded-lg border-2
                ${isEditing 
                  ? "border-gray-200 focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20" 
                  : "border-gray-200 bg-gray-50"
                }
                transition-all outline-none
              `}
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Employee ID
            </label>
            <input
              type="text"
              value={profileData.employee_id || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, employee_id: e.target.value })
              }
              disabled={!isEditing}
              className={`
                w-full px-4 py-2 rounded-lg border-2
                ${isEditing 
                  ? "border-gray-200 focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20" 
                  : "border-gray-200 bg-gray-50"
                }
                transition-all outline-none
              `}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Bio (Optional)
          </label>
          <textarea
            value={profileData.bio || ""}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
            disabled={!isEditing}
            rows={4}
            placeholder="Tell us about yourself..."
            className={`
              w-full px-4 py-2 rounded-lg border-2 resize-none
              ${isEditing 
                ? "border-gray-200 focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20" 
                : "border-gray-200 bg-gray-50"
              }
              transition-all outline-none
            `}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Generate avatar from initials (same as PersonDisplay)
function generateAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="hsl(${hue}, 65%, 50%)"/>
      <text 
        x="50" 
        y="50" 
        font-size="40" 
        font-weight="600" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-family="system-ui, -apple-system, sans-serif"
      >${initials}</text>
    </svg>
  `)}`;
}
