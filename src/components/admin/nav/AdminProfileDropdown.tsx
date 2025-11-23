"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfilePicture from "@/components/common/ProfilePicture";
import ProfileSheet from "@/components/admin/profile/ProfileSheet.ui";

export default function AdminProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;
        const data = await res.json();
        if (data.ok && data.data) {
          setUserProfile({
            name: data.data.name || data.data.email?.split("@")[0] || "Admin",
            avatarUrl: data.data.avatarUrl || data.data.profile_picture || null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3 text-sm text-neutral-900 shadow-inner transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Profile menu"
          suppressHydrationWarning
        >
          <ProfilePicture
            src={userProfile?.avatarUrl || undefined}
            name={userProfile?.name || "Admin"}
            size="sm"
          />
          <span className="hidden sm:inline">{userProfile?.name || "Admin"}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <ProfilePicture
                  src={userProfile?.avatarUrl || undefined}
                  name={userProfile?.name || "Admin"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userProfile?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Admin</p>
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setShowProfileSheet(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <a
                href="/admin/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </div>

            <div className="border-t border-gray-200 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileSheet open={showProfileSheet} onClose={() => setShowProfileSheet(false)} />
    </>
  );
}

