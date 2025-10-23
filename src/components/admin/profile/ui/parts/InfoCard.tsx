"use client";

import * as React from "react";

export default function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        {icon} {title}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-neutral-900">{value}</div>
    </div>
  );
}
