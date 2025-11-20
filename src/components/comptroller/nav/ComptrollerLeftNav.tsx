"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  History, 
  FileText,
  UserRound,
  Settings,
  HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";
import ProfilePicture from "@/components/common/ProfilePicture";

type NavLink = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavLink[] = [
  { href: "/comptroller/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/comptroller/inbox", label: "Budget Reviews", Icon: Inbox },
  { href: "/comptroller/history", label: "History", Icon: History },
  { href: "/comptroller/reports", label: "Reports", Icon: FileText },
  { href: "/comptroller/profile", label: "Profile", Icon: UserRound },
  { href: "/comptroller/settings", label: "Settings", Icon: Settings },
];

export default function ComptrollerLeftNav() {
  const pathname = usePathname() ?? "";
  const [pendingCount, setPendingCount] = React.useState(0);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const navRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const containerRef = React.useRef<HTMLElement | null>(null);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/comptroller/inbox/count");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setPendingCount(data.count || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch pending count:", error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user profile for avatar
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          return;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }
        const data = await res.json();
        if (data.ok && data.data) {
          setUserProfile({
            name: data.data.name || data.data.email?.split("@")[0] || "Comptroller",
            avatarUrl: data.data.avatarUrl || data.data.profile_picture || null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const isProfileActive = pathname === "/comptroller/profile" || pathname.startsWith("/comptroller/profile/");

  return (
    <nav 
      ref={containerRef}
      aria-label="Comptroller menu" 
      className="space-y-1.5 relative flex flex-col min-h-full"
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Profile Section at Top */}
      <Link
        href="/comptroller/profile"
        className={[
          "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 mb-2 z-10",
          isProfileActive
            ? "text-white"
            : "text-neutral-700 hover:text-white active:scale-[0.98]",
        ].join(" ")}
        onMouseEnter={() => setHoveredItem("profile")}
      >
        {isProfileActive && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-0"
            initial={false}
            style={{ background: '#7a0019' }}
            layoutId="activeNav"
          />
        )}
        <ProfilePicture
          src={userProfile?.avatarUrl || undefined}
          name={userProfile?.name || "Comptroller"}
          size="sm"
          className="flex-shrink-0 relative z-10"
        />
        <span className="flex-1 group-hover:text-white relative z-10 break-words line-clamp-2">
          {userProfile?.name || "Profile"}
        </span>
        {isProfileActive && (
          <div className="h-2 w-2 rounded-full bg-white/80 relative z-10"></div>
        )}
      </Link>

      <div className="h-px bg-gray-200 mb-2"></div>
      {/* Sliding active background */}
      {(() => {
        const activeHref = NAV.find(item => isActive(item.href, item.exact))?.href;
        
        if (!activeHref) return null;
        
        const activeItem = navRefs.current[activeHref];
        const container = containerRef.current;
        if (!activeItem || !container) return null;
        
        const itemRect = activeItem.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = itemRect.top - containerRect.top + container.scrollTop;
        const left = itemRect.left - containerRect.left;
        
        return (
          <motion.div
            className="absolute pointer-events-none rounded-xl shadow-md bg-[#7a0019]"
            initial={false}
            animate={{
              top: `${top}px`,
              left: `${left}px`,
              width: `${itemRect.width}px`,
              height: `${itemRect.height}px`,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 180, 
              damping: 25,
              mass: 1.2
            }}
          />
        );
      })()}

      {/* Floating hover background */}
      {hoveredItem && navRefs.current[hoveredItem] && containerRef.current && (() => {
        // Check if hovering over active item to fade it out
        const hoveredIsActive = NAV.some(item => 
          isActive(item.href, item.exact) && item.href === hoveredItem
        );
        
        const item = navRefs.current[hoveredItem];
        const container = containerRef.current;
        if (!item || !container) return null;
        
        const itemRect = item.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = itemRect.top - containerRect.top + container.scrollTop;
        const left = itemRect.left - containerRect.left;
        
        return (
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out"
            style={{
              background: '#7A0010',
              borderRadius: '0.5rem',
              opacity: hoveredIsActive ? 0 : 1,
              top: `${top}px`,
              left: `${left}px`,
              width: `${itemRect.width}px`,
              height: `${itemRect.height}px`,
            }}
          />
        );
      })()}
      {NAV.map((item, idx) => {
        const active = isActive(item.href, item.exact);
        const isInbox = item.href === "/comptroller/inbox";
        const showBadge = isInbox && pendingCount > 0;
        
        const isHovered = hoveredItem === item.href;
        
        return (
          <Link
            key={`${idx}-${item.href}`}
            ref={(el) => { navRefs.current[item.href] = el; }}
            href={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            className={[
              "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "text-white"
                : "text-slate-700 hover:text-white",
            ].join(" ")}
          >
            <item.Icon className="h-5 w-5 group-hover:text-white" />
            <span className="flex-1 group-hover:text-white">{item.label}</span>
            {showBadge && (
              <span 
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: (active || isHovered) ? '#ffffff' : '#7A0010',
                  color: (active || isHovered) ? '#7A0010' : '#ffffff'
                }}
              >
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
