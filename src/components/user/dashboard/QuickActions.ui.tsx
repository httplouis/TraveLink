"use client";

import { FilePlus2, CalendarDays, ListChecks, HelpCircle } from "lucide-react";

type Props = {
  onNewRequest?: () => void;
  onOpenSchedule?: () => void;
};

export default function QuickActions({ onNewRequest, onOpenSchedule }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 text-sm font-medium text-gray-900">Quick actions</div>

      {/* Segmented control style (one outline, subtle separators) */}
      <div className="inline-flex w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        <Segment
          label="New request"
          Icon={FilePlus2}
          onClick={onNewRequest}
          title="New request (N)"
        />
        <Divider />
        <Segment
          label="Open schedule"
          Icon={CalendarDays}
          onClick={onOpenSchedule}
          title="Open schedule (S)"
        />
        <Divider />
        <Segment
          label="My requests"
          Icon={ListChecks}
          href="/user/request?tab=mine"
          title="My requests"
        />
        <Divider />
        <Segment
          label="Help / FAQ"
          Icon={HelpCircle}
          href="/user/feedback"
          title="Help / FAQ"
        />
      </div>
    </div>
  );
}

function Divider() {
  return <span className="w-px bg-neutral-200/70" aria-hidden />;
}

function Segment({
  label,
  Icon,
  onClick,
  href,
  title,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  title?: string;
}) {
  const cls =
    "group flex w-full items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-neutral-700 outline-none transition hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#7A0010]/25";
  const content = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-neutral-200 transition group-hover:ring-[#7A0010]/40">
        <Icon className="h-4 w-4 text-neutral-600 group-hover:text-[#7A0010]" />
      </span>
      <span className="leading-tight">{label}</span>
    </>
  );

  if (href) {
    return (
      <a className={cls} href={href} title={title} aria-label={label}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} title={title} aria-label={label}>
      {content}
    </button>
  );
}
