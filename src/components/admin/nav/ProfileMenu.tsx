"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const clickAway = (e: MouseEvent) => {
      if (!ref.current) return;
      if (open && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", clickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", clickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="ml-1 flex items-center gap-2 rounded-full bg-white/12 px-2.5 py-1.5 text-sm hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-[13px] font-semibold">
          A
        </span>
        <span className="hidden sm:block">Admin</span>
        <svg className="h-4 w-4 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.5 7 10 11.5 14.5 7l1 1L10 14 4.5 8l1-1Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-w-[92vw] rounded-xl bg-neutral-900/95 p-2 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur"
        >
          <Link
            href="/admin/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-base font-semibold">
              A
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Admin</span>
              <span className="text-xs text-white/70">View profile</span>
            </div>
          </Link>

          <Link
            href="/admin/org/ccms"
            className="mt-1 flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
              TL
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">TraviLink – CCMS</span>
              <span className="text-xs text-white/70">Organization profile</span>
            </div>
          </Link>

          <div className="my-2 h-px w-full bg-white/10" />

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <GearIcon />
            <div className="flex-1">
              <div className="text-sm font-medium">Settings & privacy</div>
              <div className="text-xs text-white/70">Account, permissions, RLS, security</div>
            </div>
          </Link>

          <Link
            href="/admin/help"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <HelpIcon />
            <div className="flex-1">
              <div className="text-sm font-medium">Help & support</div>
              <div className="text-xs text-white/70">Docs, contact support</div>
            </div>
          </Link>

          <button
            className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <DisplayIcon />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Display & accessibility</div>
              <div className="text-xs text-white/70">Theme, density</div>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FeedbackIcon />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Give feedback</div>
              <div className="text-xs text-white/70">Tell us what’s working</div>
            </div>
          </button>

          <div className="my-2 h-px w-full bg-white/10" />

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg p-2 text-red-200 hover:bg-white/10"
            role="menuitem"
          >
            <LogoutIcon />
            <span className="text-sm font-semibold">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* tiny inline icons */
function GearIcon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 13h2.1a7 7 0 0 0 .6 1.5L4.2 16l1.8 3.1 1.5-1.1a7 7 0 0 0 1.5.6V21h3v-2.1a7 7 0 0 0 1.5-.6l1.5 1.1 1.8-3.1-1.5-1.1a7 7 0 0 0 .6-1.5H21v-3h-2.1a7 7 0 0 0-.6-1.5l1.5-1.1L18 3.3l-1.5 1.1a7 7 0 0 0-1.5-.6V2h-3v1.9a7 7 0 0 0-1.5.6L7.9 3.3 6 6.4l1.5 1.1a7 7 0 0 0-.6 1.5H3v3Z"/></svg>; }
function HelpIcon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm1.2-4.95v.2h-2.1v-.4c0-1 .6-1.6 1.5-2.1.7-.4 1-.7 1-1.2 0-.7-.6-1.2-1.5-1.2s-1.6.4-2.2 1l-1.3-1.5A4.66 4.66 0 0 1 12 5c2 0 3.6 1.2 3.6 3 0 1.2-.6 1.9-1.7 2.3-.7.4-1 .6-1 .97Z"/></svg>; }
function DisplayIcon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v12H3V5Zm0 14h18v2H3v-2Z"/></svg>; }
function FeedbackIcon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H6l-2 2V4Zm4 4h8v2H8V8Zm0 4h6v2H8v-2Z"/></svg>; }
function LogoutIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17v2h-6V5h6v2H6v10h4Zm9-5-4-4v3h-5v2h5v3l4-4Z"/></svg>; }
