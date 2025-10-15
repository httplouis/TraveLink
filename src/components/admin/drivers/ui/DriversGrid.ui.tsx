"use client";
import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { Edit, Trash2, ChevronRight, Phone, Mail, IdCard } from "lucide-react";
import { StatusBadge } from "@/components/common/ui/StatusBadge.ui";

const BRAND = "#7a0019";

export function DriversGrid({
  rows,
  onEdit,
  onDelete,
  onOpenDetails,
}: {
  rows: Driver[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        No drivers match your filters.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((d) => (
        <div
          key={d.id}
          className="group rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm transition hover:shadow-md hover:ring-gray-300"
        >
          {/* Media */}
          <div className="relative overflow-hidden rounded-t-2xl">
            <div className="aspect-[16/7] bg-gray-50">
              {d.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.avatarUrl}
                  alt={`${d.firstName} ${d.lastName}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  No avatar
                </div>
              )}
            </div>

            {/* Status */}
            <div className="absolute left-3 top-3">
              <StatusBadge value={d.status} />
            </div>
          </div>

          {/* Header */}
          <div className="px-3 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] text-gray-500">
                  {d.code}
                </div>
                <div className="truncate text-base font-semibold tracking-tight">
                  {d.firstName} {d.lastName}
                </div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="px-3 pt-2">
            <div className="grid gap-1.5 text-sm text-gray-700">
              <MetaRow icon={<Phone size={16} className="opacity-70" />} value={d.phone ?? "—"} />
              <MetaRow icon={<Mail size={16} className="opacity-70" />} value={d.email ?? "—"} />
              <MetaRow
                icon={<IdCard size={16} className="opacity-70" />}
                value={`Lic. ${d.licenseClass} • ${d.licenseNo}`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between px-3 pb-3">
            <button
              onClick={() => onOpenDetails(d.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white shadow-sm transition"
              style={{ background: BRAND }}
            >
              View details <ChevronRight size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              <IconBtn title="Edit" onClick={() => onEdit(d.id)} icon={<Edit size={16} />} />
              <IconBtn title="Delete" onClick={() => onDelete(d.id)} icon={<Trash2 size={16} />} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaRow({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 text-gray-600">
        {icon}
      </div>
      <span className="truncate text-gray-900">{value}</span>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  icon,
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white p-1.5 text-gray-700 shadow-sm transition hover:bg-gray-50"
    >
      {icon}
    </button>
  );
}
