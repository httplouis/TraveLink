"use client";

import { motion } from "framer-motion";
import { FilePlus2, CalendarDays, ListChecks, HelpCircle, Copy } from "lucide-react";
import QuickDuplicateRequest from "@/components/common/QuickDuplicateRequest";

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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl ring-1 ring-gray-200/50"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-200/20 to-teal-200/20 blur-3xl" />
      
      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {onNewRequest && (
            <Segment
              label="New Request"
              Icon={FilePlus2}
              onClick={onNewRequest}
              title="New request (N)"
              color="blue"
            />
          )}
          <Segment
            label="Schedule"
            Icon={CalendarDays}
            onClick={onOpenSchedule}
            title="Open schedule (S)"
            color="green"
          />
          <Segment
            label="My Requests"
            Icon={ListChecks}
            href="/user/request?tab=mine"
            title="My requests"
            color="purple"
          />
          <Segment
            label="Help"
            Icon={HelpCircle}
            href="/user/feedback"
            title="Help / FAQ"
            color="orange"
          />
        </div>
        
        {/* Quick Duplicate */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <QuickDuplicateRequest basePath="/user" />
        </div>
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
  color,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  title?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200",
  };

  const cls = `group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${colorClasses[color]}`;
  
  const content = (
    <>
      <div className="p-2 rounded-lg bg-white/60">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
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
