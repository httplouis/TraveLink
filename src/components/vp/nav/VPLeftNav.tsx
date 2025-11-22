"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  PlusSquare,
  FileClock,
  ListChecks,
  Car,
  IdCard,
  MessageSquareText,
  Inbox,
  LogOut,
  Settings,
} from "lucide-react";
import * as React from "react";
import { motion } from "framer-motion";
import ProfilePicture from "@/components/common/ProfilePicture";
import { ConfirmDialog } from "@/components/common/ConfirmDialog.ui";

type Item =
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

const NAV: Item[] = [
  { type: "link", href: "/vp", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { type: "link", href: "/vp/schedule", label: "Schedule", Icon: CalendarDays },

  {
    type: "group",
    label: "Request",
    Icon: PlusSquare,
    children: [
      { href: "/vp/request", label: "New request", Icon: PlusSquare, exact: true },
      { href: "/vp/drafts", label: "Drafts", Icon: FileClock },
      { href: "/vp/submissions", label: "Submissions", Icon: ListChecks },
    ],
  },

  { type: "link", href: "/vp/inbox", label: "Inbox", Icon: Inbox },

  { type: "link", href: "/vp/vehicles", label: "Vehicles", Icon: Car },
  { type: "link", href: "/vp/drivers", label: "Drivers", Icon: IdCard },
  { type: "link", href: "/vp/feedback", label: "Feedback", Icon: MessageSquareText },
  { type: "link", href: "/vp/settings", label: "Settings", Icon: Settings },
];

export default function VPLeftNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [submissionsCount, setSubmissionsCount] = React.useState(0);
  const [inboxCount, setInboxCount] = React.useState(0);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const navRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  React.useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        console.log("[VPLeftNav] 🔍 Starting fetch to /api/requests/my-submissions/count");
        const res = await fetch("/api/requests/my-submissions/count", { cache: "no-store" });
        console.log("[VPLeftNav] 📡 Submissions count response:", {
          ok: res.ok,
          status: res.status,
          contentType: res.headers.get("content-type")
        });
        if (!res.ok) {
          console.warn("[VPLeftNav] ❌ Submissions count API not OK:", res.status);
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Error response body:", errorText.substring(0, 500));
          return;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("[VPLeftNav] ❌ Submissions count API returned non-JSON response");
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Non-JSON response body:", errorText.substring(0, 500));
          return;
        }
        console.log("[VPLeftNav] ✅ Parsing submissions count JSON...");
        const json = await res.json();
        console.log("[VPLeftNav] ✅ Submissions count JSON parsed:", { ok: json.ok, count: json.pending_count });
        if (mounted && json.ok) {
          setSubmissionsCount(json.pending_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch submissions count:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const fetchInboxCount = async () => {
      try {
        console.log("[VPLeftNav] 🔍 Starting fetch to /api/vp/inbox/count");
        const res = await fetch("/api/vp/inbox/count", { cache: "no-store" });
        console.log("[VPLeftNav] 📡 Inbox count response:", {
          ok: res.ok,
          status: res.status,
          contentType: res.headers.get("content-type")
        });
        if (!res.ok) {
          console.warn("[VPLeftNav] ❌ Inbox count API not OK:", res.status);
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Error response body:", errorText.substring(0, 500));
          return;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("[VPLeftNav] ❌ Inbox count API returned non-JSON response");
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Non-JSON response body:", errorText.substring(0, 500));
          return;
        }
        console.log("[VPLeftNav] ✅ Parsing inbox count JSON...");
        const json = await res.json();
        console.log("[VPLeftNav] ✅ Inbox count JSON parsed:", { ok: json.ok, count: json.pending_count });
        if (mounted && json.ok) {
          setInboxCount(json.pending_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch inbox count:", err);
      }
    };

    fetchInboxCount();
    const interval = setInterval(fetchInboxCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("[VPLeftNav] 🔍 Starting fetch to /api/profile");
        const res = await fetch("/api/profile");
        console.log("[VPLeftNav] 📡 Profile response:", {
          ok: res.ok,
          status: res.status,
          contentType: res.headers.get("content-type")
        });
        if (!res.ok) {
          console.warn("[VPLeftNav] ❌ Profile API not OK:", res.status);
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Error response body:", errorText.substring(0, 500));
          return;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("[VPLeftNav] ❌ Profile API returned non-JSON response");
          const errorText = await res.text();
          console.error("[VPLeftNav] ❌ Non-JSON response body:", errorText.substring(0, 500));
          return;
        }
        console.log("[VPLeftNav] ✅ Parsing profile JSON...");
        const data = await res.json();
        console.log("[VPLeftNav] ✅ Profile JSON parsed:", { ok: data.ok, hasData: !!data.data });
        if (data.ok && data.data) {
          setUserProfile({
            name: data.data.name || data.data.email?.split("@")[0] || "VP",
            avatarUrl: data.data.avatarUrl || data.data.profile_picture || null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const isProfileActive = pathname === "/vp/profile" || pathname.startsWith("/vp/profile/");

  return (
    <nav 
      ref={containerRef}
      aria-label="VP menu" 
      className="space-y-1.5 relative flex flex-col min-h-full"
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Profile Section at Top */}
      <Link
        href="/vp/profile"
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
          name={userProfile?.name || "VP"}
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
      {/* Main nav sliding active background */}
      {(() => {
        let activeHref: string | undefined;
        
        for (const item of NAV) {
          if (item.type === "link" && isActive(item.href, item.exact)) {
            activeHref = item.href;
            break;
          } else if (item.type === "group") {
            const anyChildActive = item.children.some(c => isActive(c.href, c.exact));
            if (anyChildActive) {
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
            style={{ background: '#7a0019', zIndex: 0 }}
          />
        );
      })()}

      {/* Sub-nav sliding active background */}
      {(() => {
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

      {/* Floating hover background */}
      {hoveredItem && navRefs.current[hoveredItem] && containerRef.current && (() => {
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
        if (item.type === "link") {
          const active = isActive(item.href, item.exact);
          const isHovered = hoveredItem === item.href;
          const isInbox = item.href === "/vp/inbox";
          const showBadge = isInbox && inboxCount > 0;
          
          return (
            <Link
              key={`${idx}-${item.href}`}
              ref={(el) => { navRefs.current[item.href] = el; }}
              href={item.href}
              onClick={(e) => {
                console.log("[VPLeftNav] 🔗 Link clicked, href:", item.href);
                // Force navigation if Link doesn't work
                if (item.href === "/vp/inbox") {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[VPLeftNav] 🚀 Forcing navigation to /vp/inbox");
                  // Use window.location as fallback if router.push doesn't work
                  setTimeout(() => {
                    router.push("/vp/inbox");
                    // Fallback to window.location if router.push doesn't navigate after 100ms
                    setTimeout(() => {
                      if (window.location.pathname !== "/vp/inbox") {
                        console.log("[VPLeftNav] ⚠️ Router.push didn't work, using window.location");
                        window.location.href = "/vp/inbox";
                      }
                    }, 100);
                  }, 0);
                }
              }}
              onMouseEnter={() => {
                setHoveredItem(item.href);
                if (!active) {
                  router.prefetch(item.href);
                }
              }}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                active
                  ? "text-white"
                  : "text-neutral-700 hover:text-white active:scale-[0.98]",
              ].join(" ")}
              style={{ position: 'relative', zIndex: 20 }}
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
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              )}
              {active && !showBadge && (
                <div className="h-2 w-2 rounded-full bg-white/80"></div>
              )}
            </Link>
          );
        }

        const anyActive = item.children.some((c) => isActive(c.href, c.exact));
        const firstChild = item.children[0];
        const groupKey = `group-${item.label.toLowerCase()}`;
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

            <div className="space-y-1 pl-6 relative">
              {item.children.map((c) => {
                const active = isActive(c.href, c.exact);
                const isSubmissions = c.href === "/vp/submissions";
                const showBadge = isSubmissions && submissionsCount > 0;
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
                    {showBadge && (
                      <span 
                        className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-all duration-300"
                        style={{
                          backgroundColor: (active || isHovered) ? '#ffffff' : '#7a0019',
                          color: (active || isHovered) ? '#7a0019' : '#ffffff'
                        }}
                      >
                        {submissionsCount > 9 ? "9+" : submissionsCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex-1"></div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleLogoutClick}
          disabled={loggingOut}
          className="w-full group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 text-neutral-700 hover:text-white hover:bg-[#7a0019] active:scale-[0.98] disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="flex-1 text-left group-hover:text-white">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        tone="danger"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
}
