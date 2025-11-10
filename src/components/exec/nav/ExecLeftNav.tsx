"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  CalendarDays,
  PlusSquare,
  FileClock,
  ListChecks,
  History,
  Car,
  IdCard,
  UserRound,
  Settings,
} from "lucide-react";
import * as React from "react";
import { motion } from "framer-motion";

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
  { type: "link", href: "/exec/dashboard", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { type: "link", href: "/exec/inbox", label: "Executive review", Icon: FileText },
  { type: "link", href: "/exec/schedule", label: "Schedule", Icon: CalendarDays },

  {
    type: "group",
    label: "Request",
    Icon: PlusSquare,
    children: [
      { href: "/exec/request", label: "New request", Icon: PlusSquare, exact: true },
      { href: "/exec/request/drafts", label: "Drafts", Icon: FileClock },
      { href: "/exec/request/submissions", label: "My Submissions", Icon: ListChecks },
      { href: "/exec/request/history", label: "My History", Icon: History },
    ],
  },

  { type: "link", href: "/exec/vehicles", label: "Vehicles", Icon: Car },
  { type: "link", href: "/exec/drivers", label: "Drivers", Icon: IdCard },
  { type: "link", href: "/exec/profile", label: "Profile", Icon: UserRound },
  { type: "link", href: "/exec/settings", label: "Settings", Icon: Settings },
];

export default function ExecLeftNav() {
  const pathname = usePathname() || "";
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const navRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav 
      ref={containerRef}
      aria-label="Executive menu"
      className="space-y-1.5 relative"
      onMouseLeave={() => setHoveredItem(null)}
    >
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
            style={{ background: '#7a0019' }}
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
            className="absolute pointer-events-none rounded-md"
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
            style={{ background: 'rgba(122, 0, 25, 0.08)' }}
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
          
          return (
            <Link
              key={`${idx}-${item.href}`}
              ref={(el) => { navRefs.current[item.href] = el; }}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "text-white"
                  : "text-neutral-700 hover:text-white active:scale-[0.98]",
              ].join(" ")}
            >
              <item.Icon className={`h-5 w-5 transition-transform ${active ? "" : "group-hover:scale-110 group-hover:text-white"}`} />
              <span className="flex-1 group-hover:text-white">{item.label}</span>
              {active && (
                <div className="h-2 w-2 rounded-full bg-white/80"></div>
              )}
            </Link>
          );
        }

        // Group with sub-nav
        const anyActive = item.children.some((c) => isActive(c.href, c.exact));
        const firstChild = item.children[0];
        const groupKey = `group-${item.label.toLowerCase()}`;
        
        return (
          <div key={`group-${idx}`} className="space-y-1.5">
            <Link
              ref={(el) => { navRefs.current[groupKey] = el; }}
              href={firstChild.href}
              onMouseEnter={() => setHoveredItem(groupKey)}
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
            <div className="space-y-0.5 pl-6 mt-1 relative">
              {item.children.map((c) => {
                const active = isActive(c.href, c.exact);
                
                return (
                  <Link
                    key={c.href}
                    ref={(el) => { navRefs.current[c.href] = el; }}
                    href={c.href}
                    onMouseEnter={() => setHoveredItem(c.href)}
                    className={[
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "text-[#7a0019] border-l-2 border-[#7a0019]"
                        : "text-neutral-600 hover:text-[#7a0019] border-l-2 border-transparent",
                    ].join(" ")}
                  >
                    <c.Icon className="h-4 w-4 group-hover:text-[#7a0019]" />
                    <span className="flex-1 group-hover:text-[#7a0019]">{c.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
