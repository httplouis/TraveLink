"use client";
import { usePathname } from "next/navigation";

export default function Breadcrumbs({ className = "" }: { className?: string }) {
  const path = (usePathname() || "/admin").replace(/^\/+/, "");
  const parts = path.split("/").filter(Boolean);
  const segs = parts[0] === "admin" ? parts.slice(1) : parts;
  const crumbs = ["Admin", ...segs.map(seg => seg.replace(/-/g, " ").replace(/\b\w/g, s => s.toUpperCase()))];

  return (
    <div className={`text-sm text-neutral-600 ${className}`}>
      {crumbs.map((c, i) => (
        <span key={i} className="after:content-['›'] last:after:content-[''] after:mx-2">{c}</span>
      ))}
    </div>
  );
}
