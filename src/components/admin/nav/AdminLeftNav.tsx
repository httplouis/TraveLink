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
} from "lucide-react";
import { useRequestsNavBadge } from "@/components/admin/requests/hooks/useRequestsBadge";

/* Brand tokens */
const BRAND = "#7a1f2a";
const BRAND_DARK = "#6A0E17";
const NAV_W_OPEN = 280;
const NAV_W_COLLAPSED = 72;

type Item = { href: string; label: string; Icon: React.ComponentType<any>; section?: string };

const NAV: Item[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, section: "CORE" },
  { href: "/admin/requests", label: "Requests", Icon: FileText, section: "CORE" },

  { href: "/admin/schedule", label: "Schedule", Icon: CalendarDays, section: "MANAGEMENT" },
  { href: "/admin/drivers", label: "Drivers", Icon: Users, section: "MANAGEMENT" },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Truck, section: "MANAGEMENT" },
  { href: "/admin/maintenance", label: "Maintenance", Icon: Wrench, section: "MANAGEMENT" },

  { href: "/admin/track", label: "Track / Live", Icon: MapPin, section: "MONITORING" },
  { href: "/admin/history", label: "History / Logs", Icon: History, section: "MONITORING" },

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
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/15 hover:bg-white/20 hover:ring-white/25"
    >
      <ChevronLeft className={["h-5 w-5", collapsed ? "rotate-180" : ""].join(" ")} />
    </button>
  );
}

export default function AdminLeftNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const requestsBadge = useRequestsNavBadge();

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
    root.style.setProperty("--tl-nav-bg", `linear-gradient(180deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`);
    root.style.setProperty("--tl-nav-fg", "#ffffff");
    root.style.setProperty("--tl-nav-border", "transparent");
    root.style.setProperty("--brand", BRAND);
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
        background: "var(--tl-nav-bg)",
        borderRight: "1px solid var(--tl-nav-border)",
        borderRadius: 24,
        width: collapsed ? NAV_W_COLLAPSED : NAV_W_OPEN,
      }}
    >
      <div className="flex h-full w-full flex-col">
        {/* Header row: search + button aligned */}
        <div className="sticky top-0 z-20 bg-transparent px-3 pt-3">
          <div className="flex items-center gap-2">
            {!collapsed && (
              <div className="flex-1">
                {/* ===== Sidebar Search (smooth + crisp) ===== */}
                <div className="relative">
                  {/* icon ABOVE the input so backdrop-blur won't affect it */}
                  <div className="pointer-events-none absolute inset-y-0 left-2 z-10 flex items-center">
                    <Search
                      aria-hidden
                      className="h-5 w-5 text-white"     // even 20×20
                      strokeWidth={2}                      // default lucide stroke
                      shapeRendering="geometricPrecision"  // smoother curves
                    />
                  </div>

                  <input
                    ref={searchInputRef}
                    placeholder="Search… (⌘K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                      relative z-0
                      h-10 w-full rounded-xl border border-white/20 bg-white/10
                      pl-10 pr-9 text-sm text-white placeholder-white/70
                      outline-none backdrop-blur-[2px]
                      hover:bg-white/12 focus:bg-white/14 focus:ring-1 focus:ring-white/30
                    "
                    autoComplete="off"
                  />

                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute inset-y-0 right-2 my-auto inline-flex h-6 w-6 items-center justify-center rounded-lg text-white/85 hover:bg-white/10"
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <CollapseToggle collapsed={collapsed} onClick={() => setCollapsed((v) => !v)} />
          </div>

          {!collapsed && (
            <div className="px-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-white/70">
              TRAVILINK
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-4">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section} className={collapsed ? "mb-0" : "mb-6"}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {section}
                </div>
              )}

              <ul className="space-y-1">
                {items.map(({ href, label, Icon }) => {
                  const active =
                    pathname === href || (href !== "/admin" && (pathname ?? "").startsWith(href));
                  const showBadge = href === "/admin/requests" && (requestsBadge ?? 0) > 0;

                  const base = collapsed
                    ? "relative flex h-11 w-full items-center justify-center rounded-lg px-0"
                    : "relative flex items-center gap-3 rounded-lg px-3 py-2.5";

                  const hoverBg = active ? "bg-white/15" : "hover:bg-white/10";

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        data-nav-link="true"
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? label : undefined}
                        onClick={(e) => {
                          if (collapsed) e.stopPropagation();
                        }}
                        className={["group text-sm font-medium", base, hoverBg].join(" ")}
                      >
                        {!collapsed && (
                          <span
                            className={[
                              "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded",
                              active ? "bg-white" : "bg-transparent group-hover:bg-white/50",
                            ].join(" ")}
                          />
                        )}

                        <Icon className="h-5 w-5 shrink-0 text-white" />

                        {!collapsed && (
                          <span
                            className={["truncate", active ? "font-semibold text-white" : "text-white/90"].join(" ")}
                          >
                            {label}
                          </span>
                        )}

                        {showBadge && !collapsed && (
                          <span className="ml-auto inline-flex h-5 shrink-0 items-center rounded-full bg-rose-600 px-2 text-xs font-semibold leading-none text-white">
                            {requestsBadge}
                          </span>
                        )}
                        {showBadge && collapsed && (
                          <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
                            {requestsBadge}
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
