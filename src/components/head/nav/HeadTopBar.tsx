"use client";

import Link from "next/link";
import { Bell, CircleUserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HeadTopBar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending requests count
  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        // Use lightweight count endpoint instead of fetching full data
        const res = await fetch("/api/head/inbox/count", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.ok) {
          setPendingCount(json.pending_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch pending count:", err);
      }
    };

    // Initial fetch
    fetchCount();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7A0010] text-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/head/dashboard" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[#7A0010] text-sm font-bold shadow-sm">
              TL
            </span>
            <span className="font-semibold text-base">TraviLink</span>
          </Link>
          <span className="text-white/40">|</span>
          <span className="text-white/90 font-medium">Head</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/head/inbox"
            className="relative rounded-full p-2 hover:bg-white/10"
            aria-label={`${pendingCount} pending requests`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white shadow-sm">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
          </Link>
          <Link
            href="/head/profile"
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Profile"
          >
            <CircleUserRound className="h-6 w-6" />
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
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
