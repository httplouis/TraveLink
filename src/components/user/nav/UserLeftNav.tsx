"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  PlusSquare,
  UserRound,
  MessageSquareText,
} from "lucide-react";

const items = [
  { href: "/user", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { href: "/user/schedule", label: "Schedule", Icon: CalendarDays },
  { href: "/user/request", label: "Request", Icon: PlusSquare },
  { href: "/user/profile", label: "Profile", Icon: UserRound },
  { href: "/user/feedback", label: "Feedback", Icon: MessageSquareText },
];

export default function UserLeftNav() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav aria-label="User menu" className="space-y-3">
      {items.map(({ href, label, Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-neutral-100 text-[#7a0019]"
                : "bg-white text-neutral-700 hover:bg-neutral-50",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-[#7a0019]",
                active ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
            <Icon className={`h-4 w-4 ${active ? "text-[#7a0019]" : "text-neutral-500"}`} />
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
