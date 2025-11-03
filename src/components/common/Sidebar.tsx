"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Shared “who am I” shape coming from /api/me */
export type Me = {
  id: string;
  full_name: string;
  department: string | null;
  role: "admin" | "faculty" | "driver";
  is_head: boolean;
  is_hr: boolean;
  is_exec: boolean;
};

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm transition ${
        active
          ? "bg-white text-[#7A0010] font-medium shadow-sm"
          : "text-slate-600 hover:bg-white/50"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar({ me }: { me: Me }) {
  // always a string (avoid "possibly null")
  const pathname = usePathname() ?? "";

  // If you're inside a role section, stick to that base.
  // Else, infer from the user's role/flags.
  let base = "/user";
  if (pathname.startsWith("/head")) base = "/head";
  else if (pathname.startsWith("/hr")) base = "/hr";
  else if (pathname.startsWith("/exec")) base = "/exec";
  else if (pathname.startsWith("/admin")) base = "/admin";
  else if (pathname.startsWith("/driver")) base = "/driver";
  else {
    if (me.role === "admin") base = "/admin";
    else if (me.role === "driver") base = "/driver";
    else if (me.is_head) base = "/head";
    else if (me.is_hr) base = "/hr";
    else if (me.is_exec) base = "/exec";
    else base = "/user";
  }

  return (
    <aside className="min-h-dvh w-[230px] border-r border-slate-200 bg-slate-100 px-4 py-6">
      <nav className="space-y-4">
        {/* CORE */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Core
          </p>
          <NavItem
            href={`${base}/dashboard`}
            label="Dashboard"
            active={pathname === `${base}/dashboard`}
          />
          <NavItem
            href={`${base}/schedule`}
            label="Schedule"
            active={pathname.startsWith(`${base}/schedule`)}
          />
        </div>

        {/* REQUEST */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Request
          </p>
          <NavItem
            href={`${base}/request`}
            label="New request"
            active={pathname === `${base}/request`}
          />
          <NavItem
            href={`${base}/request/drafts`}
            label="Drafts"
            active={pathname.startsWith(`${base}/request/drafts`)}
          />
          <NavItem
            href={`${base}/request/submissions`}
            label="Submissions"
            active={pathname.startsWith(`${base}/request/submissions`)}
          />
        </div>

        {/* HEAD extra */}
        {base === "/head" ? (
          <div>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Head
            </p>
            <NavItem
              href="/head/inbox"
              label="Inbox (for approval)"
              active={pathname.startsWith("/head/inbox")}
            />
          </div>
        ) : null}

        {/* HR extra */}
        {base === "/hr" ? (
          <div>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              HR
            </p>
            <NavItem
              href="/hr/inbox"
              label="HR endorsements"
              active={pathname.startsWith("/hr/inbox")}
            />
          </div>
        ) : null}

        {/* ADMIN extra */}
        {base === "/admin" ? (
          <div>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <NavItem
              href="/admin/requests"
              label="Admin panel"
              active={pathname.startsWith("/admin/requests")}
            />
          </div>
        ) : null}

        {/* ACCOUNT */}
        <div>
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Account
          </p>
          <NavItem
            href={`${base}/profile`}
            label="Profile"
            active={pathname.startsWith(`${base}/profile`)}
          />
          <NavItem
            href={`${base}/settings`}
            label="Settings"
            active={pathname.startsWith(`${base}/settings`)}
          />
        </div>
      </nav>
    </aside>
  );
}
