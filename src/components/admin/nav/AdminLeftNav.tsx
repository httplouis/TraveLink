// src/components/admin/nav/AdminLeftNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Truck,
  Wrench,
  MapPin,
  History,
  FileBarChart,
  Settings,
  MessageSquare,
  Search,
  ChevronLeft,
  X,
  Building2,
  Inbox,
  Send,
  ClipboardList,
  FilePen,
} from "lucide-react";
import { useRequestsNavBadge } from "@/components/admin/requests/hooks/useRequestsBadge";
import { motion } from "framer-motion";

/* Solid maroon theme */
const PRIMARY_MAROON = "#7a0010"; // Unified maroon
const DARKER_MAROON = "#5c000c"; // Darker shade
const HOVER_MAROON = "#8b0012"; // Lighter maroon for hover
const NAV_W_OPEN = 280;
const NAV_W_COLLAPSED = 72;

type Item = { href: string; label: string; Icon: React.ComponentType<any>; section?: string };

const NAV: Item[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, section: "CORE" },
  { href: "/admin/inbox", label: "Inbox", Icon: Inbox, section: "CORE" },
  { href: "/admin/org-request", label: "Org Request", Icon: Building2, section: "CORE" },

  { href: "/admin/my-request", label: "My Request", Icon: Send, section: "MY TRAVEL" },
  { href: "/admin/my-submissions", label: "My Submissions", Icon: ClipboardList, section: "MY TRAVEL" },
  { href: "/admin/my-drafts", label: "My Drafts", Icon: FilePen, section: "MY TRAVEL" },

  { href: "/admin/schedule", label: "Schedule", Icon: CalendarDays, section: "MANAGEMENT" },
  { href: "/admin/drivers", label: "Drivers", Icon: Users, section: "MANAGEMENT" },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Truck, section: "MANAGEMENT" },
  { href: "/admin/maintenance", label: "Maintenance", Icon: Wrench, section: "MANAGEMENT" },

  { href: "/admin/history", label: "History", Icon: History, section: "MONITORING" },
  { href: "/admin/activity", label: "Activity Log", Icon: FileText, section: "MONITORING" },

  { href: "/admin/report", label: "Reports / Exports", Icon: FileBarChart, section: "ANALYTICS" },
  { href: "/admin/feedback", label: "Feedback", Icon: MessageSquare, section: "COMMUNICATION" },
  { href: "/admin/settings", label: "Settings", Icon: Settings, section: "SYSTEM" },
];

function CollapseToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-nav-toggle="true"
      type="button"
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      title={collapsed ? "Expand (Ctrl+B)" : "Collapse (Ctrl+B)"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-opacity-80 transition-all duration-200"
      style={{backgroundColor: DARKER_MAROON}}
    >
      <ChevronLeft className={["h-4 w-4 transition-transform duration-300", collapsed ? "rotate-180" : ""].join(" ")} strokeWidth={2} />
    </button>
  );
}

export default function AdminLeftNav() {
  const pathnameFromHook = usePathname();
  // Use state to avoid hydration mismatch - pathname might be different on server vs client
  const [pathname, setPathname] = React.useState<string>("");
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const requestsBadge = useRequestsNavBadge();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const navRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const menuContainerRef = React.useRef<HTMLDivElement>(null);

  // Set pathname on client side only to avoid hydration mismatch
  React.useEffect(() => {
    setPathname(pathnameFromHook || "");
  }, [pathnameFromHook]);

  // Debug: Log badge value
  React.useEffect(() => {
    console.log("[AdminLeftNav] 🔔 Requests badge count:", requestsBadge);
  }, [requestsBadge]);

  React.useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("tl.nav.collapsed") : null;
    const initial = raw === "1";
    setCollapsed(initial);
    applyVars();
    setRootNavWidth(initial ? NAV_W_COLLAPSED : NAV_W_OPEN);
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("tl.nav.collapsed", collapsed ? "1" : "0");
    } catch {}
    setRootNavWidth(collapsed ? NAV_W_COLLAPSED : NAV_W_OPEN);
  }, [collapsed]);

  function applyVars() {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    // Solid maroon theme
    root.style.setProperty("--tl-nav-bg", PRIMARY_MAROON);
    root.style.setProperty("--tl-nav-fg", "#ffffff");
    root.style.setProperty("--tl-nav-border", DARKER_MAROON);
    root.style.setProperty("--brand", PRIMARY_MAROON);
  }

  function setRootNavWidth(px: number) {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--tl-nav-w", `${px}px`);
  }

  // Hotkeys
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "[") setCollapsed((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed]);

  function onRootClick(e: React.MouseEvent) {
    if (!collapsed) return;
    const el = e.target as HTMLElement;
    const hit = el.closest("[data-nav-link='true']") || el.closest("[data-nav-toggle='true']");
    if (!hit) setCollapsed(false);
  }

  const filtered = searchQuery.trim()
    ? NAV.filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : NAV;

  const grouped = React.useMemo(() => {
    if (collapsed) return { ALL: filtered };
    const g: Record<string, Item[]> = {};
    filtered.forEach((i) => {
      (g[i.section || "OTHER"] ||= []).push(i);
    });
    return g;
  }, [filtered, collapsed]);

  return (
    <aside
      role="navigation"
      aria-label="Admin navigation"
      onClick={onRootClick}
      className="h-full select-none overflow-hidden text-white"
      style={{
        backgroundColor: PRIMARY_MAROON,
        borderRadius: 20,
        width: collapsed ? NAV_W_COLLAPSED : NAV_W_OPEN,
      }}
    >
      <div className="flex h-full w-full flex-col">
        {/* Header row: search + button aligned */}
        <div className="sticky top-0 z-20 px-3 pt-3 pb-2.5" style={{backgroundColor: DARKER_MAROON}}>
          <div className="flex items-center gap-2">
            {!collapsed && (
              <div className="flex-1">
                {/* ===== Clean Search Bar ===== */}
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center">
                    <Search
                      aria-hidden
                      className="h-4 w-4 text-white transition-colors duration-200"
                      strokeWidth={2}
                    />
                  </div>

                  <input
                    ref={searchInputRef}
                    placeholder="Search… (⌘K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                      relative z-0
                      h-10 w-full rounded-lg
                      pl-10 pr-9 text-sm text-white placeholder-white
                      outline-none
                      transition-all duration-200
                    "
                    style={{backgroundColor: DARKER_MAROON, fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}
                    autoComplete="off"
                  />

                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute inset-y-0 right-2 my-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-white transition-all duration-200"
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <CollapseToggle collapsed={collapsed} onClick={() => setCollapsed((v) => !v)} />
          </div>

          {!collapsed && (
            <div className="mt-3 flex items-center gap-2.5 px-1">
              <div className="h-8 w-8 rounded-md flex items-center justify-center font-bold text-white text-[11px]" style={{backgroundColor: DARKER_MAROON, fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
                TL
              </div>
              <div>
                <div className="text-[11px] font-bold text-white tracking-wide" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.03em'}}>TRAVILINK</div>
                <div className="text-[9px] text-white font-medium opacity-80" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>Admin Portal</div>
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div 
          ref={menuContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 relative"
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Sliding active background - Only show when not collapsed */}
          {!collapsed && pathname && (() => {
            const activeHref = NAV.find(item => 
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            )?.href;
            
            if (!activeHref || !navRefs.current[activeHref] || !menuContainerRef.current) return null;
            
            const activeItem = navRefs.current[activeHref];
            const container = menuContainerRef.current;
            const itemRect = activeItem.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const top = itemRect.top - containerRect.top + container.scrollTop;
            const left = itemRect.left - containerRect.left;
            
            return (
              <motion.div
                className="absolute pointer-events-none rounded-lg bg-white shadow-sm"
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

          {/* Floating hover background with smooth fade for active items - Only show when not collapsed */}
          {!collapsed && pathname && hoveredItem && navRefs.current[hoveredItem] && menuContainerRef.current && (() => {
            // Check if hovered item is active page
            const isHoveredActive = pathname === hoveredItem || (hoveredItem !== "/admin" && pathname.startsWith(hoveredItem));
            
            const item = navRefs.current[hoveredItem];
            const container = menuContainerRef.current;
            if (!item || !container) return null;
            
            const itemRect = item.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const top = itemRect.top - containerRect.top + container.scrollTop;
            const left = itemRect.left - containerRect.left;
            
            return (
              <div
                className="absolute pointer-events-none transition-all duration-300 ease-out rounded-lg"
                style={{
                  backgroundColor: '#ffffff',
                  opacity: isHoveredActive ? 0 : 0.95,
                  top: `${top}px`,
                  left: `${left}px`,
                  width: `${itemRect.width}px`,
                  height: `${itemRect.height}px`,
                }}
              />
            );
          })()}
          
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section} className={collapsed ? "mb-0" : "mb-4"}>
              {!collapsed && (
                <div className="mb-1.5 px-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white opacity-60" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.1em'}}>
                    {section}
                  </div>
                </div>
              )}

              <ul className="space-y-0.5">
                {items.map(({ href, label, Icon }) => {
                  // Only compute active state if pathname is available (client-side)
                  const active = pathname
                    ? (pathname === href || (href !== "/admin" && pathname.startsWith(href)))
                    : false;
                  const showBadge = href === "/admin/inbox" && (requestsBadge ?? 0) > 0;

                  const base = collapsed
                    ? "relative flex h-10 w-full items-center justify-center rounded-lg px-0"
                    : "relative flex items-center gap-2.5 rounded-lg px-3 py-2";

                  const isHovered = hoveredItem === href;
                  // Remove bg-white class - sliding background handles it
                  
                  const textColor = active || isHovered ? PRIMARY_MAROON : '#ffffff';

                  return (
                    <li key={href}>
                      <Link
                        ref={(el) => { navRefs.current[href] = el; }}
                        href={href}
                        data-nav-link="true"
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? label : undefined}
                        onClick={(e) => {
                          if (collapsed) e.stopPropagation();
                        }}
                        className={["group text-sm transition-colors duration-300", base].join(" ")}
                        style={{
                          color: textColor,
                          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                          zIndex: active || isHovered ? 2 : 1,
                          position: 'relative'
                        }}
                        onMouseEnter={() => {
                          if (!collapsed) setHoveredItem(href);
                        }}
                      >
                        {!collapsed && (active || isHovered) && (
                          <span
                            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r transition-all duration-300 ease-out"
                            style={{backgroundColor: active ? '#ffffff' : PRIMARY_MAROON}}
                          />
                        )}

                        <div className={collapsed ? "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-200" : "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200"}>
                          <Icon className={collapsed ? "h-5 w-5 shrink-0" : "h-[18px] w-[18px] shrink-0"} strokeWidth={active ? 2.5 : 2} />
                        </div>

                        {!collapsed && (
                          <span
                            className={["truncate text-[13.5px] tracking-tight", active ? "font-semibold" : "font-medium"].join(" ")}
                            style={{letterSpacing: active ? '-0.01em' : '0'}}
                          >
                            {label}
                          </span>
                        )}

                        {showBadge && !collapsed && (
                          <span 
                            className="ml-auto inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none transition-all duration-300" 
                            style={{
                              backgroundColor: (active || isHovered) ? PRIMARY_MAROON : '#ffffff',
                              color: (active || isHovered) ? '#ffffff' : PRIMARY_MAROON
                            }}
                          >
                            {requestsBadge > 99 ? "99+" : requestsBadge}
                          </span>
                        )}
                        {showBadge && collapsed && (
                          <span 
                            className="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none transition-all duration-300 z-10" 
                            style={{
                              backgroundColor: '#ffffff',
                              color: PRIMARY_MAROON,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          >
                            {requestsBadge > 99 ? "99+" : requestsBadge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-2" />
      </div>
    </aside>
  );
}
