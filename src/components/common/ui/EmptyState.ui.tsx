"use client";
import * as React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No records found",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-gray-500">
      <Inbox size={48} className="mb-3 opacity-60" />
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
