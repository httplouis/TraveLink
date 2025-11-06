"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  CalendarDays,
  PlusSquare,
  FileClock,
  ListChecks,
  Car,
  IdCard,
  UserRound,
  MessageSquareText,
  Settings,
} from "lucide-react";
import * as React from "react";

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
  { type: "link", href: "/head/dashboard", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { type: "link", href: "/head/schedule", label: "Schedule", Icon: CalendarDays },
  { type: "link", href: "/head/inbox", label: "Inbox", Icon: Inbox },
  
  {
    type: "group",
    label: "Request",
    Icon: PlusSquare,
    children: [
      { href: "/head/request", label: "New request", Icon: PlusSquare, exact: true },
      { href: "/head/request/drafts", label: "Drafts", Icon: FileClock },
      { href: "/head/request/submissions", label: "My Submissions", Icon: ListChecks },
    ],
  },

  { type: "link", href: "/head/vehicles", label: "Vehicles", Icon: Car },
  { type: "link", href: "/head/drivers", label: "Drivers", Icon: IdCard },
  { type: "link", href: "/head/profile", label: "Profile", Icon: UserRound },
  { type: "link", href: "/head/feedback", label: "Feedback", Icon: MessageSquareText },
  { type: "link", href: "/head/settings", label: "Settings", Icon: Settings },
];

export default function HeadLeftNav() {
  const pathname = usePathname() ?? "";
  const [inboxCount, setInboxCount] = React.useState(0);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // Real-time polling for inbox count
  React.useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/head", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.ok) {
          setInboxCount(json.data?.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch inbox count:", err);
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
    <nav aria-label="Head menu" className="space-y-1.5">
      {NAV.map((item, idx) => {
        if (item.type === "link") {
          const active = isActive(item.href, item.exact);
          const isInbox = item.href === "/head/inbox";
          const showBadge = isInbox && inboxCount > 0;
          
          return (
            <Link
              key={`${idx}-${item.href}`}
              href={item.href}
              className={[
                "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#7A0010] text-white shadow-sm"
                  : "text-slate-700 hover:bg-[#7A0010]/5 hover:text-[#7A0010]",
              ].join(" ")}
            >
              <item.Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white text-[#7A0010] px-1.5 text-[10px] font-bold shadow-sm">
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              )}
            </Link>
          );
        }

        // --- Clickable group header → first child (/head/request) ---
        const anyActive = item.children.some((c) => isActive(c.href, c.exact));
        const firstChild = item.children[0]; // /head/request
        return (
          <div key={`group-${idx}`} className="space-y-1.5">
            <Link
              href={firstChild.href}
              className={[
                "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                anyActive 
                  ? "bg-[#7A0010] text-white shadow-sm" 
                  : "text-slate-700 hover:bg-[#7A0010]/5 hover:text-[#7A0010]",
              ].join(" ")}
              title="New request"
            >
              <item.Icon className="h-5 w-5" />
              <span className="flex-1">Request</span>
            </Link>

            {/* Children shown by default */}
            <div className="space-y-0.5 pl-6 mt-1">
              {item.children.map((c) => {
                const active = isActive(c.href, c.exact);
                
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={[
                      "group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-150",
                      active
                        ? "bg-[#7A0010]/10 text-[#7A0010] font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#7A0010]",
                    ].join(" ")}
                  >
                    <c.Icon className="h-4 w-4" />
                    <span className="flex-1">{c.label}</span>
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
