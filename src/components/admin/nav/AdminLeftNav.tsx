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
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

/* ---------- constants ---------- */

const BRAND = "#7a1f2a";
const NAV_W_OPEN = 256;
const NAV_W_COLLAPSED = 64;

type Item = { href: string; label: string; Icon: React.ComponentType<any> };

const NAV: Item[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", Icon: FileText },
  { href: "/admin/schedule", label: "Schedule", Icon: CalendarDays },
  { href: "/admin/drivers", label: "Drivers", Icon: Users },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Truck },
  { href: "/admin/maintenance", label: "Maintenance", Icon: Wrench },
  { href: "/admin/track", label: "Track / Live", Icon: MapPin },
  { href: "/admin/history", label: "History / Logs", Icon: History },
  { href: "/admin/reports", label: "Reports / Exports", Icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

/* ---------- component ---------- */

export default function AdminLeftNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Persist collapse state
  React.useEffect(() => {
    const raw = localStorage.getItem("tl.nav.collapsed");
    if (raw) setCollapsed(raw === "1");
  }, []);
  React.useEffect(() => {
    localStorage.setItem("tl.nav.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Hotkey: Ctrl+B or [
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

  // When collapsed, clicking anywhere on the rail (except the icon/links/toggle) expands
  function onRootClick(e: React.MouseEvent) {
    if (!collapsed) return;
    const el = e.target as HTMLElement;
    const hitInteractive =
      el.closest("[data-nav-link='true']") ||
      el.closest("[data-nav-toggle='true']");
    if (!hitInteractive) setCollapsed(false);
  }

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
      {/* ---------- Top row: Search + Toggle (HCI-friendly) ---------- */}
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

          {/* Top-right toggle (small, easy target) */}
          <button
            type="button"
            data-nav-toggle="true"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((v) => !v);
            }}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "shrink-0 rounded-full border",
              collapsed
                ? "border-white/25 bg-white/15 text-white hover:bg-white/25"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
              "shadow-sm p-1.5 transition",
            ].join(" ")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Section label when expanded */}
        {!collapsed && (
          <div className="mt-3 px-1 text-[11px] font-semibold tracking-wider text-neutral-500">
            TRAVILINK
          </div>
        )}
      </div>

      {/* ---------- Nav list ---------- */}
      <ul className="space-y-1 px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            pathname === href || (href !== "/admin" && (pathname ?? "").startsWith(href));

          const itemBase = collapsed
            ? "flex items-center justify-center"
            : "flex items-center gap-3";

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
                {/* Thin active indicator (left) – only when expanded */}
                {!collapsed && (
                  <span
                    className={[
                      "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2",
                      "h-5 w-0.5 rounded",
                      active ? "bg-[var(--brand)]" : "bg-transparent group-hover:bg-neutral-300",
                    ].join(" ")}
                  />
                )}

                {/* Icon (maroon), no border */}
                <Icon
                  className={[
                    "h-5 w-5 transition-colors",
                    collapsed
                      ? "text-white"
                      : active
                      ? "text-[var(--brand)]"
                      : "text-[var(--brand)]",
                    !collapsed ? "group-hover:text-[#5e1620]" : "",
                  ].join(" ")}
                />

                {/* Label (hidden when collapsed) */}
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom spacer so last item isn’t clipped */}
      <div className="h-6" />
    </div>
  );
}
