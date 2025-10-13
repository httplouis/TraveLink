"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import CollapseToggle from "@/components/common/CollapseToggle";
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
} from "lucide-react";

/* ---------- constants ---------- */

const BRAND = "#7a1f2a";
const NAV_W_OPEN = 256;
const NAV_W_COLLAPSED = 64;

type Item = { href: string; label: string; Icon: React.ComponentType<any>; badge?: number | null };

const BASE: Array<Omit<Item, "badge">> = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", Icon: FileText },
  { href: "/admin/schedule", label: "Schedule", Icon: CalendarDays },
  { href: "/admin/drivers", label: "Drivers", Icon: Users },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Truck },
  { href: "/admin/maintenance", label: "Maintenance", Icon: Wrench },
  { href: "/admin/track", label: "Track / Live", Icon: MapPin },
  { href: "/admin/history", label: "History / Logs", Icon: History },
  { href: "/admin/report", label: "Reports / Exports", Icon: FileBarChart },
  { href: "/admin/feedback", label: "Feedback", Icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

/* ---------- component ---------- */

export default function AdminLeftNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Optional: small badge for pending requests (read from localStorage mock)
  const [pending, setPending] = React.useState<number | null>(null);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("tl.admin.requests");
      if (raw) {
        const rows = JSON.parse(raw) as Array<{ status?: string }>;
        setPending(rows.filter((r) => (r.status ?? "pending") === "pending").length || null);
      }
    } catch {
      setPending(null);
    }
  }, []);

  // Persist collapse state
  React.useEffect(() => {
    const raw = localStorage.getItem("tl.nav.collapsed");
    if (raw) setCollapsed(raw === "1");
  }, []);
  React.useEffect(() => {
    localStorage.setItem("tl.nav.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Hotkey: Ctrl+B (or Meta+B) and '['
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "[") {
        setCollapsed((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Expand when clicking the rail (but not links/toggle)
  function onRootClick(e: React.MouseEvent) {
    if (!collapsed) return;
    const el = e.target as HTMLElement;
    const hitInteractive = el.closest("[data-nav-link='true']") || el.closest("[data-nav-toggle='true']");
    if (!hitInteractive) setCollapsed(false);
  }

  // Build nav with optional badges
  const NAV: Item[] = BASE.map((i) =>
    i.href === "/admin/requests" ? { ...i, badge: pending } : { ...i, badge: null }
  );

  return (
    <div
      onClick={onRootClick}
      style={
        {
          width: collapsed ? NAV_W_COLLAPSED : NAV_W_OPEN,
          background: collapsed ? BRAND : "white",
        } as React.CSSProperties
      }
      className={[
        "relative h-full select-none border-r border-neutral-200",
        "overflow-y-auto no-scrollbar",
        collapsed ? "text-white" : "text-neutral-800",
      ].join(" ")}
    >
      {/* Top row: Search + Toggle */}
      <div className={collapsed ? "px-2 pt-2 pb-1" : "px-3 pt-3 pb-2"}>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <div className="flex-1">
              <label className="sr-only">Search</label>
              <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2 py-1.5 shadow-sm">
                <Search className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  placeholder="Search…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
          )}

          <CollapseToggle
            collapsed={collapsed}
            onClick={() => setCollapsed((v) => !v)}
            data-nav-toggle="true"
          />
        </div>

        {!collapsed && (
          <div className="mt-3 px-1 text-[11px] font-semibold tracking-wider text-neutral-500">
            TRAVILINK
          </div>
        )}
      </div>

      {/* Nav list */}
      <ul className="space-y-1 px-2">
        {NAV.map(({ href, label, Icon, badge }) => {
          const active =
            pathname === href || (href !== "/admin" && (pathname ?? "").startsWith(href));

          const itemBase = collapsed ? "flex items-center justify-center" : "flex items-center gap-3";
          const activeBg = collapsed ? "bg-white/12" : "bg-neutral-100";
          const hoverBg = collapsed ? "hover:bg-white/10" : "hover:bg-neutral-50";

          return (
            <li key={href}>
              <Link
                href={href}
                data-nav-link="true"
                title={collapsed ? label : undefined}
                onClick={(e) => {
                  if (collapsed) e.stopPropagation();
                }}
                className={[
                  "group relative rounded-lg px-3 py-2 text-sm transition",
                  itemBase,
                  active ? activeBg : hoverBg,
                ].join(" ")}
                style={{ ["--brand" as any]: BRAND }}
              >
                {!collapsed && (
                  <span
                    className={[
                      "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2",
                      "h-5 w-0.5 rounded",
                      active ? "bg-[var(--brand)]" : "bg-transparent group-hover:bg-neutral-300",
                    ].join(" ")}
                  />
                )}

                <Icon
                  className={[
                    "h-5 w-5 transition-colors",
                    collapsed ? "text-white" : "text-[var(--brand)]",
                    !collapsed ? "group-hover:text-[#5e1620]" : "",
                  ].join(" ")}
                />

                {!collapsed && (
                  <>
                    <span className="truncate">{label}</span>
                    {badge && badge > 0 && (
                      <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#7a1f2a] px-1.5 text-[11px] font-semibold text-white">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="h-6" />
    </div>
  );
}
