// src/components/common/nav/UserLeftNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  PlusSquare,
  FileClock,
  ListChecks,
  Car,
  IdCard,
  UserRound,
  MessageSquareText,
} from "lucide-react";
import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

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
  { type: "link", href: "/user", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { type: "link", href: "/user/schedule", label: "Schedule", Icon: CalendarDays },

  {
    type: "group",
    label: "Request",
    Icon: PlusSquare,
    children: [
      { href: "/user/request", label: "New request", Icon: PlusSquare, exact: true },
      { href: "/user/drafts", label: "Drafts", Icon: FileClock },
      { href: "/user/submissions", label: "Submissions", Icon: ListChecks },
    ],
  },

  { type: "link", href: "/user/vehicles", label: "Vehicles", Icon: Car },
  { type: "link", href: "/user/drivers", label: "Drivers", Icon: IdCard },
  { type: "link", href: "/user/profile", label: "Profile", Icon: UserRound },
  { type: "link", href: "/user/feedback", label: "Feedback", Icon: MessageSquareText },
];

export default function UserLeftNav() {
  const pathname = usePathname() ?? "";
  const [submissionsCount, setSubmissionsCount] = React.useState(0);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // Real-time polling for submissions count
  React.useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/requests/my-submissions", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.ok && json.data) {
          // Count pending submissions
          const pending = json.data.filter((s: any) => 
            s.status?.startsWith("pending") || s.status === "submitted"
          );
          setSubmissionsCount(pending.length);
        }
      } catch (err) {
        console.error("Failed to fetch submissions count:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav aria-label="User menu" className="space-y-1.5">
      {NAV.map((item, idx) => {
        if (item.type === "link") {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={`${idx}-${item.href}`}
              href={item.href}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-[#7a0019] to-[#5a0010] text-white shadow-md shadow-[#7a0019]/20"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-[#7a0019] active:scale-[0.98]",
              ].join(" ")}
            >
              <item.Icon className={`h-5 w-5 transition-transform ${active ? "" : "group-hover:scale-110"}`} />
              <span className="flex-1">{item.label}</span>
              {active && (
                <div className="h-2 w-2 rounded-full bg-white/80"></div>
              )}
            </Link>
          );
        }

        // --- Clickable group header → first child (/user/request) ---
        const anyActive = item.children.some((c) => isActive(c.href, c.exact));
        const firstChild = item.children[0]; // /user/request
        return (
          <div key={`group-${idx}`} className="space-y-1.5">
            <Link
              href={firstChild.href}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                anyActive 
                  ? "bg-gradient-to-r from-[#7a0019] to-[#5a0010] text-white shadow-md shadow-[#7a0019]/20" 
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-[#7a0019] active:scale-[0.98]",
              ].join(" ")}
              title="New request"
            >
              <item.Icon className={`h-5 w-5 transition-transform ${anyActive ? "" : "group-hover:scale-110"}`} />
              <span className="flex-1">Request</span>
              {anyActive && (
                <div className="h-2 w-2 rounded-full bg-white/80"></div>
              )}
            </Link>

            {/* Children shown by default */}
            <div className="space-y-1 pl-6">
              {item.children.map((c) => {
                const active = isActive(c.href, c.exact);
                const isSubmissions = c.href === "/user/submissions";
                const showBadge = isSubmissions && submissionsCount > 0;
                
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={[
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-[#7a0019]/10 text-[#7a0019] border-l-2 border-[#7a0019]"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-[#7a0019] border-l-2 border-transparent",
                    ].join(" ")}
                  >
                    <c.Icon className={`h-4 w-4 transition-transform ${active ? "" : "group-hover:scale-110"}`} />
                    <span className="flex-1">{c.label}</span>
                    {showBadge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
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
    </nav>
  );
}
