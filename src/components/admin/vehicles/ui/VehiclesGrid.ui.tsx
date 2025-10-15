"use client";
import * as React from "react";
import type { Vehicle } from "@/lib/admin/vehicles/types";
import { VehicleCard } from "./VehicleCard.ui";

export function VehiclesGrid({
  rows,
  onEdit,
  onDelete,
  onOpenDetails,
}: {
  rows: (Vehicle & {
    photoUrl?: string;
    lastCheckIn?: string;
    maxLoadKg?: number;
    assignedDriver?: string;
    nextServiceISO?: string;
  })[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
        No vehicles match your filters.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map(v => (
        <VehicleCard key={v.id} v={v} onEdit={onEdit} onDelete={onDelete} onOpenDetails={onOpenDetails} />
      ))}
    </div>
  );
}
