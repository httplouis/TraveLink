"use client";

import Link from "next/link";
import { PageHeader, PageBody } from "@/components/common/Page";

/* ---------- types ---------- */
export type NotificationsTab = "unread" | "all";

export type NotificationItem = {
  id: string;
  text: string;
  time: string;   // e.g. "2h ago"
  read?: boolean; // false = unread
};

type Props = {
  tab: NotificationsTab;
  unreadCount: number;
  allCount: number;
  items?: NotificationItem[]; // combined list; we'll filter by tab in the UI
  onTabChange: (t: NotificationsTab) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
};

export default function NotificationsView({
  tab,
  unreadCount,
  allCount,
  items = [],
  onTabChange,
  onMarkAllRead,
  onRefresh,
}: Props) {
  const visible =
    tab === "unread" ? items.filter((n) => !n.read) : items;

  const hasAny = visible.length > 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Your recent updates and alerts."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className={`rounded-md border px-3 py-2 text-sm ${
                unreadCount === 0
                  ? "text-neutral-400 cursor-not-allowed"
                  : "hover:bg-neutral-50"
              }`}
              title={
                unreadCount === 0
                  ? "No notifications to mark as read"
                  : "Mark all as read"
              }
            >
              Mark all read
            </button>
            <button
              onClick={onRefresh}
              className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Refresh
            </button>
          </div>
        }
      />

      <PageBody>
        {/* Tabs */}
        <div className="rounded-lg border bg-white p-2">
          <div className="flex items-center gap-2">
            <TabButton
              active={tab === "unread"}
              onClick={() => onTabChange("unread")}
              label={`Unread (${unreadCount})`}
            />
            <TabButton
              active={tab === "all"}
              onClick={() => onTabChange("all")}
              label={`All (${allCount})`}
            />
          </div>
        </div>

        {/* Content */}
        {hasAny ? (
          <div className="mt-4 divide-y rounded-lg border bg-white">
            {visible.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {!n.read && <UnreadDot />}
                  <div>
                    <div className="text-sm">{n.text}</div>
                    <div className="text-xs text-neutral-500">{n.time}</div>
                  </div>
                </div>
                {/* space for future actions per item */}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState tab={tab} />
        )}

        {/* Tips */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">What you’ll see here</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li>Request status changes (Approved / Rejected / Needs info)</li>
              <li>Assigned vehicle and driver for your trips</li>
              <li>Schedule updates and reminders</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">Manage alerts</h3>
            <p className="mt-2 text-sm text-neutral-700">
              Control email/push notifications in{" "}
              <Link href="/faculty/profile" className="text-[#7a0019] underline">
                Profile &gt; Preferences
              </Link>.
            </p>
          </div>
        </div>
      </PageBody>
    </>
  );
}

/* ---------- small UI bits ---------- */
function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-md border ${
        active
          ? "bg-[#7a0019] text-white border-[#7a0019]"
          : "hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ tab }: { tab: "unread" | "all" }) {
  return (
    <div className="mt-4 rounded-lg border bg-white p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-neutral-100">
        <BellEmpty />
      </div>
      <h2 className="text-base font-semibold">You’re all caught up</h2>
      <p className="mt-1 text-sm text-neutral-600">
        No {tab === "unread" ? "unread " : ""}notifications yet. New updates
        about requests, schedules, and approvals will appear here.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          href="/faculty/request"
          className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Submit a Request
        </Link>
        <Link
          href="/faculty/schedule"
          className="rounded-md bg-[#7a0019] px-3 py-2 text-sm text-white"
        >
          View Schedule
        </Link>
      </div>
    </div>
  );
}

function UnreadDot() {
  return (
    <span
      className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#7a0019]"
      aria-hidden
    />
  );
}

function BellEmpty(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" {...props}>
      <path strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path strokeWidth="2" d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}
