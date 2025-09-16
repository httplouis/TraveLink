// src/components/nav/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  admin: "Admin",
  requests: "Requests",
  schedule: "Schedule",
  maintenance: "Maintenance",
  track: "Track",
  history: "History",
  profile: "Profile",
};

export default function Breadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const search = useSearchParams();

  const parts = (pathname || "/").split("/").filter(Boolean);
  if (parts.length <= 1) return <div className={`text-sm text-neutral-500 ${className}`}>Admin</div>;

  return (
    <nav aria-label="Breadcrumbs" className={`flex items-center text-sm ${className}`}>
      {parts.map((seg, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        const label = LABEL_MAP[seg] ?? seg.replace(/-/g, " ");
        return (
          <span key={href} className="flex items-center">
            {i > 0 && <ChevronRight className="mx-2 h-4 w-4 text-neutral-300" />}
            {isLast ? (
              <span className="capitalize font-medium text-neutral-900">{label}</span>
            ) : (
              <Link href={href} className="capitalize text-neutral-500 hover:text-neutral-800">
                {label}
              </Link>
            )}
          </span>
        );
      })}
      {search.get("new") === "1" && (
        <span className="ml-3 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Creating…</span>
      )}
    </nav>
  );
}
