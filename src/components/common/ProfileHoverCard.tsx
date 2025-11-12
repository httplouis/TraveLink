"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Building2 } from 'lucide-react';
import ProfilePicture from './ProfilePicture';

interface ProfileData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  office?: string;
  profile_picture?: string;
  is_online?: boolean;
}

interface ProfileHoverCardProps {
  profile: ProfileData;
  children: React.ReactNode;
  className?: string;
}

export default function ProfileHoverCard({
  profile,
  children,
  className = ''
}: ProfileHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Delay showing card to prevent flicker
    setTimeout(() => {
      if (isHovered) setShowCard(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowCard(false);
  };

  return (
    <span 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Element */}
      <span className="cursor-pointer hover:text-[#7a0019] transition-colors duration-200 border-b border-dotted border-gray-400 hover:border-[#7a0019]">
        {children}
      </span>

      {/* Hover Card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.2 
            }}
            className="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-6"
            style={{ 
              left: '50%', 
              transform: 'translateX(-50%)',
              top: '100%'
            }}
          >
            {/* Profile Header */}
            <div className="flex items-start space-x-4 mb-4">
              <ProfilePicture
                src={profile.profile_picture}
                name={profile.name}
                size="lg"
                isOnline={profile.is_online}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {profile.name}
                </h3>
                {profile.position && (
                  <p className="text-sm font-medium text-[#7a0019] truncate">
                    {profile.position}
                  </p>
                )}
                {profile.department && (
                  <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {profile.department}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              {profile.email && (
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
              )}
              
              {profile.phone && (
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profile.phone}</span>
                </div>
              )}
              
              {profile.office && (
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profile.office}</span>
                </div>
              )}

              {/* Online Status */}
              {profile.is_online !== undefined && (
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${profile.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                    {profile.is_online ? 'Online now' : 'Offline'}
                  </span>
                </div>
              )}
            </div>

            {/* Card Arrow */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Utility component for names that should have hover cards
interface NameWithProfileProps {
  name: string;
  profile?: Partial<ProfileData>;
  className?: string;
}

export function NameWithProfile({ 
  name, 
  profile, 
  className = '' 
}: NameWithProfileProps) {
  if (!profile || !profile.id) {
    // No profile data, just render name
    return <span className={className}>{name}</span>;
  }

  return (
    <ProfileHoverCard 
      profile={{
        id: profile.id || 'unknown',
        name: name,
        ...profile
      }}
      className={className}
    >
      {name}
    </ProfileHoverCard>
  );
}
