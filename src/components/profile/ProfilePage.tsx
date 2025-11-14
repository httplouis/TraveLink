"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Mail, Phone, Building, Hash, FileText, Save, X } from "lucide-react";
import { pageVariants } from "@/lib/animations";
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
      setIsEditing(false);
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
    if (profileData.roles?.is_executive) roles.push({ 
      label: "Executive", 
      className: "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200/50"
    });
    if (profileData.roles?.is_hr) roles.push({ 
      label: "HR", 
      className: "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200/50"
    });
    if (profileData.roles?.is_comptroller) roles.push({ 
      label: "Comptroller", 
      className: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200/50"
    });
    if (profileData.roles?.is_admin) roles.push({ 
      label: "Admin", 
      className: "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200/50"
    });
    if (profileData.roles?.is_head) roles.push({ 
      label: "Department Head", 
      className: "bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border-teal-200/50"
    });
    if (profileData.roles?.is_user) roles.push({ 
      label: "Faculty/Staff", 
      className: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200/50"
    });
    return roles;
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* Header Card - Premium Design */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
        {/* Premium Cover with Gradient */}
        <div className="relative h-40 bg-gradient-to-br from-[#7A0010] via-[#8A0010] to-[#5A0010] overflow-hidden">
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          {/* Gradient Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        <div className="px-6 sm:px-8 lg:px-10 pb-8 relative">
          {/* Profile Picture - Enhanced with Hover Tooltip */}
          <div className="flex items-end justify-between -mt-20 mb-6">
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative"
              >
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#7A0010] to-[#5A0010] rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity" />
                
                <img
                  src={imagePreview || profileData.profile_picture || generateAvatar(profileData.name)}
                  alt={profileData.name}
                  className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-2xl object-cover bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
                />
                
                {isEditable && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="
                      absolute bottom-2 right-2
                      w-12 h-12 rounded-full
                      bg-gradient-to-br from-[#7A0010] to-[#5A0010] text-white
                      flex items-center justify-center
                      shadow-xl hover:shadow-2xl
                      transition-all duration-200
                      border-2 border-white
                      backdrop-blur-sm
                      z-10
                    "
                  >
                    <Camera className="w-5 h-5" />
                  </motion.button>
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

            {/* Edit/Save Buttons - Premium */}
            {isEditable && (
              <div className="flex gap-3">
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="
                      px-6 py-2.5 rounded-xl
                      bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white font-semibold
                      shadow-lg hover:shadow-xl
                      transition-all duration-200
                      border border-[#7A0010]/20
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
                        px-5 py-2.5 rounded-xl
                        bg-gray-100 text-gray-700 font-medium
                        hover:bg-gray-200 transition-all duration-200
                        border border-gray-200
                      "
                    >
                      <X className="w-4 h-4 inline mr-1.5" />
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      className="
                        px-6 py-2.5 rounded-xl
                        bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white font-semibold
                        shadow-lg hover:shadow-xl
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        border border-[#7A0010]/20
                      "
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <>
                          <Save className="w-4 h-4 inline mr-1.5" />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Name and Position - Enhanced Typography */}
          <div className="space-y-3 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {profileData.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {profileData.position_title && (
                <p className="text-lg sm:text-xl text-gray-700 font-medium">
                  {profileData.position_title}
                </p>
              )}
              {profileData.department && (
                <>
                  {profileData.position_title && (
                    <span className="text-gray-400">•</span>
                  )}
                  <p className="text-lg sm:text-xl text-gray-600">
                    {profileData.department}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Role Badges - Premium Design */}
          <div className="flex flex-wrap gap-2.5">
            {getRoleBadges().map((role, index) => (
              <motion.span
                key={role.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  px-4 py-1.5 rounded-full text-xs font-semibold
                  border shadow-sm hover:shadow-md transition-shadow
                  ${role.className}
                `}
              >
                {role.label}
              </motion.span>
            ))}
          </div>

        </div>
      </div>

      {/* Contact Information - Premium Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7A0010]/10 to-[#5A0010]/5 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#7A0010]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Email - Enhanced */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="
                w-full px-4 py-3 rounded-xl border-2 border-gray-200
                bg-gradient-to-br from-gray-50 to-gray-100/50
                text-gray-700 font-medium cursor-not-allowed
                shadow-inner
              "
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              Email cannot be changed
            </p>
          </div>

          {/* Phone - Enhanced */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-gray-600" />
              </div>
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
                w-full px-4 py-3 rounded-xl border-2 font-medium
                transition-all duration-200 outline-none
                ${isEditing 
                  ? "border-gray-300 bg-white shadow-sm focus:border-[#7A0010] focus:ring-4 focus:ring-[#7A0010]/10 focus:shadow-lg" 
                  : "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 text-gray-600"
                }
              `}
            />
          </div>

          {/* Department - Enhanced */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building className="w-4 h-4 text-gray-600" />
              </div>
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
                w-full px-4 py-3 rounded-xl border-2 font-medium
                transition-all duration-200 outline-none
                ${isEditing 
                  ? "border-gray-300 bg-white shadow-sm focus:border-[#7A0010] focus:ring-4 focus:ring-[#7A0010]/10 focus:shadow-lg" 
                  : "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 text-gray-600"
                }
              `}
            />
          </div>

          {/* Employee ID - Read Only */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Hash className="w-4 h-4 text-gray-600" />
              </div>
              Employee ID
            </label>
            <input
              type="text"
              value={profileData.employee_id || "Not assigned"}
              disabled
              readOnly
              className="
                w-full px-4 py-3 rounded-xl border-2 border-gray-200
                bg-gradient-to-br from-gray-50 to-gray-100/50
                text-gray-600 font-medium cursor-not-allowed
                shadow-inner
              "
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              Employee ID is managed by administrators
            </p>
          </div>
        </div>

        {/* Bio - Enhanced */}
        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            Bio (Optional)
          </label>
          <textarea
            value={profileData.bio || ""}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
            disabled={!isEditing}
            rows={5}
            placeholder="Tell us about yourself, your interests, or anything you'd like to share..."
            className={`
              w-full px-4 py-3 rounded-xl border-2 resize-none font-medium
              transition-all duration-200 outline-none
              ${isEditing 
                ? "border-gray-300 bg-white shadow-sm focus:border-[#7A0010] focus:ring-4 focus:ring-[#7A0010]/10 focus:shadow-lg" 
                : "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 text-gray-600"
              }
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
