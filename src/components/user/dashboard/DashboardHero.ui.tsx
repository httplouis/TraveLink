"use client";

import { motion } from "framer-motion";

export default function DashboardHero({
  userName = "Traveler",
  onOpenSchedule,
  onNewRequest,
}: {
  userName?: string;
  onOpenSchedule?: () => void;
  onNewRequest?: () => void;
}) {
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] p-5 text-white shadow-sm"
    >
      {/* animated grain/shine */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_-10%_-10%,white_0,transparent_60%)]" />
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%220.8%22 numOctaves=%222%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.15%22/></svg>')", backgroundSize: "400px 400px" }}
        />
      </div>

      <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm/5 text-white/85">Welcome to TraviLink</p>
          <h1 className="text-2xl font-semibold">{userName}</h1>
          <p className="mt-1 text-sm text-white/80">{day} · {time}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewRequest}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#7A0010] shadow hover:opacity-95"
          >
            New request
          </button>
          <button
            onClick={onOpenSchedule}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
          >
            View schedule
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <Chip label="Fast approvals" />
        <Chip label="Live vehicle status" />
        <Chip label="One-tap scheduling" />
      </div>
    </motion.section>
  );
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 backdrop-blur">{label}</span>;
}
