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
  HelpCircle,
  PlusSquare,
  FileClock,
  ListChecks
} from "lucide-react";
import { motion } from "framer-motion";
import ProfilePicture from "@/components/common/ProfilePicture";
import { useRouter } from "next/navigation";

type NavItem =
  | {
      type: "link";
      href: string;
      label: string;
      Icon: React.ComponentType<{ className?: string }>;
      exact?: boolean;
    }
  | {
      type: "group";
      label: string;
      Icon: React.ComponentType<{ className?: string }>;
      children: Array<{
        href: string;
        label: string;
        Icon: React.ComponentType<{ className?: string }>;
        exact?: boolean;
      }>;
    };

const NAV: NavItem[] = [
  { type: "link", href: "/comptroller/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { type: "link", href: "/comptroller/inbox", label: "Budget Reviews", Icon: Inbox },
  {
    type: "group",
    label: "Request",
    Icon: PlusSquare,
    children: [
      { href: "/comptroller/request", label: "New request", Icon: PlusSquare, exact: true },
      { href: "/comptroller/drafts", label: "Drafts", Icon: FileClock },
      { href: "/comptroller/submissions", label: "Submissions", Icon: ListChecks },
    ],
  },
  { type: "link", href: "/comptroller/history", label: "History", Icon: History },
  { type: "link", href: "/comptroller/reports", label: "Reports", Icon: FileText },
  { type: "link", href: "/comptroller/profile", label: "Profile", Icon: UserRound },
  { type: "link", href: "/comptroller/settings", label: "Settings", Icon: Settings },
];

export default function ComptrollerLeftNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [pendingCount, setPendingCount] = React.useState(0);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const navRefs = React.useRef<Record<string, HTMLElement | null>>({});
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
      {/* Main nav sliding active background (for Dashboard, Budget Reviews, Request parent) */}
      {(() => {
        // Find active main nav item or group parent
        let activeHref: string | undefined;
        
        for (const item of NAV) {
          if (item.type === "link" && isActive(item.href, item.exact)) {
            activeHref = item.href;
            break;
          } else if (item.type === "group") {
            const anyChildActive = item.children.some(c => isActive(c.href, c.exact));
            if (anyChildActive) {
              // Use group key for the parent "Request" link
              activeHref = `group-${item.label.toLowerCase()}`;
              break;
            }
          }
        }
        
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
            className="absolute pointer-events-none rounded-xl shadow-md"
            initial={false}
            animate={{
              top: `${top}px`,
              left: `${left}px`,
              width: `${itemRect.width}px`,
              height: `${itemRect.height}px`,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 25,
              mass: 0.8
            }}
            style={{ background: '#7a0019' }}
          />
        );
      })()}

      {/* Sub-nav sliding active background (for New request, Drafts, Submissions) */}
      {(() => {
        // Find active sub-nav item
        let activeSubHref: string | undefined;
        
        for (const item of NAV) {
          if (item.type === "group") {
            for (const child of item.children) {
              if (isActive(child.href, child.exact)) {
                activeSubHref = child.href;
                break;
              }
            }
            if (activeSubHref) break;
          }
        }
        
        if (!activeSubHref) return null;
        
        const activeItem = navRefs.current[activeSubHref];
        const container = containerRef.current;
        if (!activeItem || !container) return null;
        
        const itemRect = activeItem.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = itemRect.top - containerRect.top + container.scrollTop;
        const left = itemRect.left - containerRect.left;
        
        return (
          <motion.div
            className="absolute pointer-events-none rounded-lg"
            initial={false}
            animate={{
              top: `${top}px`,
              left: `${left}px`,
              width: `${itemRect.width}px`,
              height: `${itemRect.height}px`,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 30,
              mass: 0.8
            }}
            style={{ background: 'rgba(122, 0, 25, 0.15)' }}
          />
        );
      })()}

      {/* Floating hover background for all items */}
      {hoveredItem && navRefs.current[hoveredItem] && containerRef.current && (() => {
        // Check if hovering over active item to fade it out
        const isGroupKey = hoveredItem.startsWith('group-');
        const hoveredIsActive = isGroupKey 
          ? NAV.some(item => item.type === "group" && `group-${item.label.toLowerCase()}` === hoveredItem && 
                            item.children.some(c => isActive(c.href, c.exact)))
          : NAV.some(item => {
              if (item.type === "link") {
                return isActive(item.href, item.exact) && item.href === hoveredItem;
              } else {
                return item.children.some(c => isActive(c.href, c.exact) && c.href === hoveredItem);
              }
            });
        
        const item = navRefs.current[hoveredItem];
        const container = containerRef.current;
        if (!item || !container) return null;
        
        const itemRect = item.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = itemRect.top - containerRect.top + container.scrollTop;
        const left = itemRect.left - containerRect.left;
        
        // Check if it's a sub-nav item by checking if it's in any group's children
        // Group parent keys start with "group-", so they're main nav items
        const isGroupParent = hoveredItem.startsWith('group-');
        const isSubNav = !isGroupParent && NAV.some(navItem => 
          navItem.type === "group" && navItem.children.some(c => c.href === hoveredItem)
        );
        
        return (
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out"
            style={{
              background: isSubNav ? 'rgba(122, 0, 25, 0.12)' : '#7a0019',
              borderRadius: isSubNav ? '0.5rem' : '0.75rem',
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
        if (item.type === "group") {
          const anyActive = item.children.some((c) => isActive(c.href, c.exact));
          const firstChild = item.children[0]; // /user/request
          const groupKey = `group-${item.label.toLowerCase()}`; // unique key for parent
          
          return (
            <div key={`group-${idx}`} className="space-y-1.5">
              <Link
                ref={(el) => { navRefs.current[groupKey] = el; }}
                href={firstChild.href}
                onMouseEnter={() => {
                  setHoveredItem(groupKey);
                  if (!anyActive) {
                    router.prefetch(firstChild.href);
                  }
                }}
                className={[
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  anyActive 
                    ? "text-white" 
                    : "text-neutral-700 hover:text-white active:scale-[0.98]",
                ].join(" ")}
                title="New request"
              >
                <item.Icon className={`h-5 w-5 transition-transform ${anyActive ? "" : "group-hover:scale-110 group-hover:text-white"}`} />
                <span className="flex-1 group-hover:text-white">Request</span>
                {anyActive && (
                  <div className="h-2 w-2 rounded-full bg-white/80"></div>
                )}
              </Link>

              {/* Children shown by default */}
              <div className="space-y-1 pl-6 relative">
                {item.children.map((c) => {
                  const active = isActive(c.href, c.exact);
                  const isHovered = hoveredItem === c.href;
                  
                  return (
                    <Link
                      key={c.href}
                      ref={(el) => { navRefs.current[c.href] = el; }}
                      href={c.href}
                      onMouseEnter={() => {
                        setHoveredItem(c.href);
                        if (!active) {
                          router.prefetch(c.href);
                        }
                      }}
                      className={[
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "text-[#7a0019] border-l-2 border-[#7a0019]"
                          : "text-neutral-600 hover:text-[#7a0019] border-l-2 border-transparent",
                      ].join(" ")}
                    >
                      <c.Icon className={`h-4 w-4 transition-transform ${active ? "" : "group-hover:scale-110 group-hover:text-[#7a0019]"}`} />
                      <span className="flex-1 group-hover:text-[#7a0019]">{c.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }
        
        // Regular link
        const active = isActive(item.href, item.exact);
        const isInbox = item.href === "/comptroller/inbox";
        const showBadge = isInbox && pendingCount > 0;
        const isHovered = hoveredItem === item.href;
        
        return (
          <Link
            key={`${idx}-${item.href}`}
            ref={(el) => { navRefs.current[item.href] = el; }}
            href={item.href}
            onMouseEnter={() => {
              setHoveredItem(item.href);
              // Prefetch on hover for faster navigation
              if (!active) {
                router.prefetch(item.href);
              }
            }}
            className={[
              "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "text-white"
                : "text-neutral-700 hover:text-white active:scale-[0.98]",
            ].join(" ")}
          >
            <item.Icon className={`h-5 w-5 transition-transform ${active ? "" : "group-hover:scale-110 group-hover:text-white"}`} />
            <span className="flex-1 group-hover:text-white">{item.label}</span>
            {showBadge && (
              <span 
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-all duration-300"
                style={{
                  backgroundColor: (active || isHovered) ? '#ffffff' : '#7a0019',
                  color: (active || isHovered) ? '#7a0019' : '#ffffff'
                }}
              >
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
            {active && !showBadge && (
              <div className="h-2 w-2 rounded-full bg-white/80"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
