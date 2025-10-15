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

  // Always expanded group
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav aria-label="User menu" className="space-y-2">
      {NAV.map((item, idx) => {
        if (item.type === "link") {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={`${idx}-${item.href}`}
              href={item.href}
              className={[
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-neutral-100 text-[#7a0019]"
                  : "bg-white text-neutral-700 hover:bg-neutral-50",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "absolute left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[#7a0019]",
                  active ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
              <item.Icon
                className={`h-4 w-4 ${active ? "text-[#7a0019]" : "text-neutral-500"}`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        }

        // --- Always-expanded group (no toggle) ---
        const anyActive = item.children.some((c) => isActive(c.href, c.exact));
        return (
          <div key={`group-${idx}`} className="space-y-1">
            {/* Group header, non-interactive */}
            <div
              className={[
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                anyActive ? "bg-neutral-100 text-[#7a0019]" : "bg-white text-neutral-700",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "absolute left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[#7a0019]",
                  anyActive ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
              <item.Icon
                className={`h-4 w-4 ${anyActive ? "text-[#7a0019]" : "text-neutral-500"}`}
              />
              <span className="font-medium">Request</span>
            </div>

            {/* Children shown by default */}
            <div className="space-y-1 pl-8">
              {item.children.map((c) => {
                const active = isActive(c.href, c.exact);
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={[
                      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-neutral-100 text-[#7a0019]"
                        : "bg-white text-neutral-700 hover:bg-neutral-50",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className={[
                        "absolute left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[#7a0019]",
                        active ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                    />
                    <c.Icon
                      className={`h-4 w-4 ${
                        active ? "text-[#7a0019]" : "text-neutral-500"
                      }`}
                    />
                    <span className="font-medium">{c.label}</span>
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
