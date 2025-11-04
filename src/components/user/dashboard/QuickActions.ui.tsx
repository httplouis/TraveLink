"use client";

import { motion } from "framer-motion";
import { FilePlus2, CalendarDays, ListChecks, HelpCircle } from "lucide-react";

type Props = {
  onNewRequest?: () => void;
  onOpenSchedule?: () => void;
};

export default function QuickActions({ onNewRequest, onOpenSchedule }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="text-sm font-semibold text-gray-900">Quick actions</div>
        <div className="h-1 w-1 rounded-full bg-gray-300" />
        <div className="text-xs text-gray-500">Fast shortcuts</div>
      </div>

      {/* Grid layout instead of segmented control */}
      <div className="grid grid-cols-2 gap-2">
        <Segment
          label="New request"
          Icon={FilePlus2}
          onClick={onNewRequest}
          title="New request (N)"
          color="from-blue-50 to-blue-100"
          hoverColor="hover:from-blue-100 hover:to-blue-200"
        />
        <Segment
          label="Schedule"
          Icon={CalendarDays}
          onClick={onOpenSchedule}
          title="Open schedule (S)"
          color="from-green-50 to-green-100"
          hoverColor="hover:from-green-100 hover:to-green-200"
        />
        <Segment
          label="My requests"
          Icon={ListChecks}
          href="/user/request?tab=mine"
          title="My requests"
          color="from-purple-50 to-purple-100"
          hoverColor="hover:from-purple-100 hover:to-purple-200"
        />
        <Segment
          label="Help"
          Icon={HelpCircle}
          href="/user/feedback"
          title="Help / FAQ"
          color="from-amber-50 to-amber-100"
          hoverColor="hover:from-amber-100 hover:to-amber-200"
        />
      </div>
    </motion.div>
  );
}

function Segment({
  label,
  Icon,
  onClick,
  href,
  title,
  color = "from-gray-50 to-gray-100",
  hoverColor = "hover:from-gray-100 hover:to-gray-200",
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  title?: string;
  color?: string;
  hoverColor?: string;
}) {
  const cls = `group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br ${color} ${hoverColor} transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`;
  
  const content = (
    <>
      <motion.div
        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="h-5 w-5 text-gray-700" />
      </motion.div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
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
