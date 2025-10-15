"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react"; // if you don't use lucide, replace with an inline SVG

export default function BackToRequestButton() {
  return (
    <Link
      href="/user/request"
      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Back to Request</span>
    </Link>
  );
}
