"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  PlusSquare,
  FileClock,
  FileStack,
  Car,
  IdCard,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as React from "react";

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

const topItems: Item[] = [
  { href: "/user", label: "Dashboard", Icon: LayoutGrid, exact: true },
  { href: "/user/schedule", label: "Schedule", Icon: CalendarDays },
];

const requestChildren: Item[] = [
  { href: "/user/request", label: "New request", Icon: PlusSquare, exact: true },
  { href: "/user/drafts", label: "Drafts", Icon: FileClock },
  { href: "/user/submissions", label: "Submissions", Icon: FileStack },
];

const fleetItems: Item[] = [
  { href: "/user/vehicles", label: "Vehicles", Icon: Car },
  { href: "/user/drivers", label: "Drivers", Icon: IdCard },
];

export default function UserLeftNav() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // OPEN STATE: open at mount if current route is within /user/request/*
  const initiallyOpen =
    pathname === "/user/request" || pathname.startsWith("/user/request/");
  const [openRequest, setOpenRequest] = React.useState(initiallyOpen);

  // NOTE: We intentionally DO NOT auto-close/open on route change anymore.
  // The group state is now purely user-controlled via the toggle.

  return (
    <nav aria-label="User menu" className="space-y-3">
      {/* Top single items */}
      {topItems.map(({ href, label, Icon, exact }) => {
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

      {/* Request group */}
      <div>
        <button
          type="button"
          onClick={() => setOpenRequest((v) => !v)}
          className={[
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
            openRequest ? "bg-neutral-100 text-[#7a0019]" : "bg-white text-neutral-700 hover:bg-neutral-50",
          ].join(" ")}
          aria-expanded={openRequest}
          aria-controls="user-nav-request"
        >
          <div className="flex items-center gap-3">
            {/* Slim active bar when any child is active */}
            <span
              aria-hidden
              className={[
                "relative -ml-2 mr-1 h-6 w-[3px] rounded-full bg-[#7a0019]",
                requestChildren.some((c) => isActive(c.href, c.exact)) ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
            <PlusSquare className="h-4 w-4 text-neutral-500" />
            <span className="font-medium">Request</span>
          </div>
          {openRequest ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {openRequest && (
          <div id="user-nav-request" className="mt-1 space-y-1 pl-7">
            {requestChildren.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    active
                      ? "bg-neutral-100 text-[#7a0019]"
                      : "bg-white text-neutral-700 hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
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
          </div>
        )}
      </div>

      {/* Fleet single items (not grouped to avoid extra nesting) */}
      {fleetItems.map(({ href, label, Icon }) => {
        const active = isActive(href);
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
              aria-hidden
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

      {/* Bottom items */}
      <Link
        href="/user/profile"
        className={[
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive("/user/profile")
            ? "bg-neutral-100 text-[#7a0019]"
            : "bg-white text-neutral-700 hover:bg-neutral-50",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-[#7a0019]",
            isActive("/user/profile") ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <IdCard className={`h-4 w-4 ${isActive("/user/profile") ? "text-[#7a0019]" : "text-neutral-500"}`} />
        <span className="font-medium">Profile</span>
      </Link>

      <Link
        href="/user/feedback"
        className={[
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive("/user/feedback")
            ? "bg-neutral-100 text-[#7a0019]"
            : "bg-white text-neutral-700 hover:bg-neutral-50",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-[#7a0019]",
            isActive("/user/feedback") ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <FileStack className={`h-4 w-4 ${isActive("/user/feedback") ? "text-[#7a0019]" : "text-neutral-500"}`} />
        <span className="font-medium">Feedback</span>
      </Link>
    </nav>
  );
}
