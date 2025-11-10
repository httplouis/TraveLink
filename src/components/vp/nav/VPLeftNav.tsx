"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  History, 
  BarChart3,
  PlusSquare,
  FileClock,
  ListChecks,
  UserRound,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

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
  { type: "link", href: "/vp/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { type: "link", href: "/vp/inbox", label: "Executive Review", Icon: Inbox },
  
  {
    type: "group",
    label: "Requests",
    Icon: PlusSquare,
    children: [
      { href: "/vp/request", label: "New Request", Icon: PlusSquare, exact: true },
      { href: "/vp/request/drafts", label: "Drafts", Icon: FileClock },
      { href: "/vp/request/submissions", label: "My Submissions", Icon: ListChecks },
      { href: "/vp/request/history", label: "My History", Icon: History },
    ],
  },
  
  { type: "link", href: "/vp/analytics", label: "Analytics", Icon: BarChart3 },
  { type: "link", href: "/vp/profile", label: "Profile", Icon: UserRound },
  { type: "link", href: "/vp/settings", label: "Settings", Icon: Settings },
];

export default function VPLeftNav() {
  const pathname = usePathname() ?? "";
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set(["Requests"]));
  const navRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const containerRef = React.useRef<HTMLElement | null>(null);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <nav 
      ref={containerRef}
      className="space-y-1.5 relative"
      onMouseLeave={() => setHoveredItem(null)}
    >
      {NAV.map((item) => {
        if (item.type === "group") {
          const isExpanded = expandedGroups.has(item.label);
          
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className="group relative flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 text-slate-700 hover:text-white hover:bg-[#7a0019]/10"
              >
                <item.Icon className="h-5 w-5 group-hover:text-[#7a0019]" />
                <span className="flex-1 text-left group-hover:text-[#7a0019]">{item.label}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-4 mt-1 space-y-1"
                >
                  {item.children.map((child) => {
                    const active = isActive(child.href, child.exact);
                    
                    return (
                      <Link
                        key={child.href}
                        ref={(el) => { navRefs.current[child.href] = el; }}
                        href={child.href}
                        onMouseEnter={() => setHoveredItem(child.href)}
                        className={[
                          "group relative flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                          active ? "bg-[#7a0019] text-white" : "text-slate-700 hover:text-white hover:bg-[#7a0019]/10",
                        ].join(" ")}
                      >
                        <child.Icon className={`h-4 w-4 ${active ? 'text-white' : 'group-hover:text-[#7a0019]'}`} />
                        <span className={active ? 'text-white' : 'group-hover:text-[#7a0019]'}>{child.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </div>
          );
        }
        
        const active = isActive(item.href, item.exact);
        
        return (
          <Link
            key={item.href}
            ref={(el) => { navRefs.current[item.href] = el; }}
            href={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            className={[
              "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              active ? "bg-[#7a0019] text-white" : "text-slate-700 hover:text-white hover:bg-[#7a0019]/10",
            ].join(" ")}
          >
            <item.Icon className={`h-5 w-5 ${active ? 'text-white' : 'group-hover:text-[#7a0019]'}`} />
            <span className={active ? 'text-white' : 'group-hover:text-[#7a0019]'}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
