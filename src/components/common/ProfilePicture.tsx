"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, User } from 'lucide-react';

interface ProfilePictureProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  isOnline?: boolean;
  onClick?: () => void;
  onUpload?: (file: File) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg'
};

const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const generateAvatarColor = (name: string): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function ProfilePicture({
  src,
  name,
  size = 'md',
  editable = false,
  isOnline = false,
  onClick,
  onUpload,
  className = ''
}: ProfilePictureProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      setIsLoading(true);
      try {
        await onUpload(file);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const initials = generateInitials(name);
  const avatarColor = generateAvatarColor(name);

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          overflow-hidden 
          border-2 
          border-gray-200 
          relative
          ${editable ? 'cursor-pointer' : onClick ? 'cursor-pointer' : ''}
          ${isHovered && editable ? 'border-[#7a0019]' : ''}
        `}
        whileHover={editable || onClick ? { scale: 1.05 } : {}}
        whileTap={editable || onClick ? { scale: 0.95 } : {}}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className={`
            w-full h-full 
            ${avatarColor} 
            flex items-center justify-center 
            text-white font-semibold
          `}>
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              initials
            )}
          </div>
        )}

        {/* Upload Overlay */}
        {editable && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <Camera className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          </div>
        )}
      </motion.div>

      {/* Online Status Indicator */}
      {isOnline && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            absolute bottom-0 right-0 
            w-3 h-3 
            bg-green-500 
            border-2 border-white 
            rounded-full
            ${size === 'sm' ? 'w-2 h-2' : size === 'xl' ? 'w-4 h-4' : 'w-3 h-3'}
          `}
        />
      )}

      {/* Hidden File Input */}
      {editable && (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id={`profile-upload-${name.replace(/\s+/g, '-')}`}
        />
      )}
    </div>
  );
}

// Person Display Component with Profile Picture
interface PersonDisplayProps {
  person: {
    id: string;
    name: string;
    email?: string;
    position?: string;
    department?: string;
    profile_picture?: string | null;
    is_online?: boolean;
  };
  showEmail?: boolean;
  showPosition?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PersonDisplay({
  person,
  showEmail = false,
  showPosition = true,
  size = 'md',
  className = ''
}: PersonDisplayProps) {
  // Guard against undefined/null person
  if (!person) {
    console.warn("[PersonDisplay] person prop is undefined or null");
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <ProfilePicture
          src={null}
          name="Unknown"
          size={size}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">Unknown</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <ProfilePicture
        src={person.profile_picture || null}
        name={person.name || "Unknown"}
        size={size}
        isOnline={person.is_online}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {person.name || "Unknown"}
        </p>
        {showPosition && (person.position || person.department) && (
          <p className="text-sm text-gray-600 truncate">
            {person.position && person.department 
              ? `${person.position}, ${person.department}`
              : person.position || person.department
            }
          </p>
        )}
        {showEmail && person.email && (
          <p className="text-xs text-gray-500 truncate">
            {person.email}
          </p>
        )}
      </div>
    </div>
  );
}
