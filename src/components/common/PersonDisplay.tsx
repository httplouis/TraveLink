"use client";

import React from "react";
import { motion } from "framer-motion";

interface PersonDisplayProps {
  name: string;
  position?: string;
  department?: string;
  email?: string;
  profilePicture?: string | null;
  isOnline?: boolean;
  showEmail?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate avatar from initials
function generateAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  // Generate color from name hash
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

const SIZE_CONFIG = {
  sm: {
    image: "w-8 h-8",
    name: "text-sm",
    subtitle: "text-xs",
    email: "text-xs",
    online: "w-2 h-2",
  },
  md: {
    image: "w-12 h-12",
    name: "text-base",
    subtitle: "text-sm",
    email: "text-xs",
    online: "w-3 h-3",
  },
  lg: {
    image: "w-16 h-16",
    name: "text-lg",
    subtitle: "text-base",
    email: "text-sm",
    online: "w-4 h-4",
  },
};

export default function PersonDisplay({
  name,
  position,
  department,
  email,
  profilePicture,
  isOnline = false,
  showEmail = false,
  size = "md",
  className = "",
}: PersonDisplayProps) {
  const sizeClasses = SIZE_CONFIG[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${className}`}
    >
      {/* Profile Picture */}
      <div className="relative flex-shrink-0">
        <img
          src={profilePicture || generateAvatar(name)}
          alt={name}
          className={`
            ${sizeClasses.image} 
            rounded-full object-cover 
            border-2 border-gray-200
            transition-transform duration-200
            hover:scale-105
          `}
        />
        {isOnline && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              absolute bottom-0 right-0 
              ${sizeClasses.online}
              bg-green-500 border-2 border-white rounded-full
            `}
          />
        )}
      </div>

      {/* Person Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-gray-900 truncate ${sizeClasses.name}`}>
          {name}
        </p>
        
        {(position || department) && (
          <p className={`text-gray-600 truncate ${sizeClasses.subtitle}`}>
            {[position, department].filter(Boolean).join(", ")}
          </p>
        )}
        
        {showEmail && email && (
          <p className={`text-gray-500 truncate ${sizeClasses.email} mt-0.5`}>
            {email}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Variant: Horizontal compact for inline use
export function PersonDisplayCompact({
  name,
  position,
  profilePicture,
  className = "",
}: Pick<PersonDisplayProps, "name" | "position" | "profilePicture" | "className">) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={profilePicture || generateAvatar(name)}
        alt={name}
        className="w-6 h-6 rounded-full object-cover border border-gray-200"
      />
      <span className="text-sm text-gray-900 font-medium">{name}</span>
      {position && (
        <span className="text-xs text-gray-500">• {position}</span>
      )}
    </div>
  );
}
