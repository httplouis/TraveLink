"use client";
import * as React from "react";
import type { Vehicle } from "@/lib/admin/vehicles/types";
import {
  Edit,
  Trash2,
  ChevronRight,
  Clock3,
  User,
  Users,
  Scale,
} from "lucide-react";

const BRAND = "#7a0019";

export function VehicleCard({
  v,
  onEdit,
  onDelete,
  onOpenDetails,
}: {
  v: Vehicle & {
    photoUrl?: string;
    lastCheckIn?: string;
    maxLoadKg?: number;
    assignedDriver?: string;
    nextServiceISO?: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const badge =
    v.status === "active"
      ? "bg-green-100 text-green-700"
      : v.status === "maintenance"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-200 text-gray-700";

  return (
    <div className="group rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm transition hover:shadow-md hover:ring-gray-300">
      {/* Media */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-[16/7] bg-gray-50">
          {v.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.photoUrl}
              alt={v.model || v.brand || 'Vehicle'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <div className="text-2xl mb-1">🚗</div>
                <div>Vehicle photo</div>
              </div>
            </div>
          )}
        </div>

        {/* Top-left status */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md ${badge}`}>
          {v.status}
        </span>

        {/* Top-right pill: capacity (users icon) */}
        <span className="absolute right-3 top-3 hidden items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs text-gray-700 shadow-sm backdrop-blur md:inline-flex">
          <Users size={14} /> {v.capacity}
        </span>
      </div>

      {/* Header */}
      <div className="px-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] text-gray-500">
              {v.brand ? `${v.brand} ${v.model}` : (v.model || 'Vehicle')}
            </div>
            <div className="truncate text-base font-semibold tracking-tight">
              {v.plateNo}
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="px-3 pt-2">
        <div className="grid gap-1.5 text-sm text-gray-700">
          <MetaRow
            icon={<Clock3 size={16} className="opacity-70" />}
            label="Last check-in/out"
            value={v.lastCheckIn ?? "—"}
          />
          <MetaRow
            icon={<Scale size={16} className="opacity-70" />}
            label="Max. load"
            value={v.maxLoadKg ? `${v.maxLoadKg.toLocaleString()} kg` : "—"}
          />
          <MetaRow
            icon={<User size={16} className="opacity-70" />}
            label="Assigned driver"
            value={v.assignedDriver ?? "—"}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between px-3 pb-3">
        <button
          onClick={() => onOpenDetails(v.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white shadow-sm transition"
          style={{ background: BRAND }}
        >
          View details <ChevronRight size={16} />
        </button>

        <div className="flex items-center gap-1.5">
          <IconBtn title="Edit" onClick={() => onEdit(v.id)} icon={<Edit size={16} />} />
          <IconBtn title="Delete" onClick={() => onDelete(v.id)} icon={<Trash2 size={16} />} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 text-gray-600">
        {icon}
        <span className="truncate">{label}</span>
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
