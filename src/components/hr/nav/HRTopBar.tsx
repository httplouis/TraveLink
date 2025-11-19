"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import HRNotificationDropdown from "./HRNotificationDropdown";
import ProfilePicture from "@/components/common/ProfilePicture";

export default function HRTopBar() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.ok && data.data) {
          setUserProfile(data.data);
        }
      } catch (err) {
        console.error("[HRTopBar] Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("[HRTopBar] Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0019] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/hr" className="inline-flex items-center gap-2.5 group">
            <div className="relative">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#7a0019] text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
                TL
              </span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">Travelink</span>
              <span className="text-xs opacity-80 font-normal">Travel Management System</span>
            </div>
          </Link>
          <span className="h-6 w-px bg-white/30" />
          <span className="opacity-90 text-sm font-medium">HR Portal</span>
        </div>

        {/* Actions - Profile, Notifications, Logout */}
        <div className="flex items-center gap-2">
          {/* Profile */}
          <Link
            href="/hr/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
            title="Profile"
          >
            <ProfilePicture
              src={userProfile?.avatarUrl || undefined}
              name={userProfile?.name || "HR"}
              size="sm"
              className="flex-shrink-0"
            />
            <span className="hidden sm:inline text-sm font-medium max-w-[150px] truncate">
              {userProfile?.name || "Profile"}
            </span>
          </Link>

          {/* Notifications */}
          <HRNotificationDropdown />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
