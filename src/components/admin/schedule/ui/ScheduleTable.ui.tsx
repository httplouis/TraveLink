// src/components/admin/schedule/ui/ScheduleTable.ui.tsx
"use client";
import React from "react";
import type { Pagination, Schedule } from "@/lib/admin/schedule/types";
import StatusBadge from "./StatusBadge";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import { canStart, canComplete, canCancel, canReopen } from "@/lib/admin/schedule/utils";

type Props = {
  rows: Schedule[];
  pagination: Pagination;
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (row: Schedule) => void;
  onDeleteMany: (ids: string[]) => void;
  onSetStatus: (id: string, s: Schedule["status"]) => void;
  onPageChange: (p: number) => void;
  onView: (row: Schedule) => void;
  toolbar: React.ReactNode;
};

export default function ScheduleTable({
  rows,
  pagination,
  selected,
  onToggleOne,
  onToggleAll,
  onEdit,
  onDeleteMany,
  onSetStatus,
  onPageChange,
  onView,
  toolbar,
}: Props) {
  const allOnPage = rows.map((r) => r.id);
  const allChecked =
    allOnPage.length > 0 && allOnPage.every((id) => selected.has(id));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* sticky toolbar area */}
      <div className="admin-sticky-toolbar px-3 py-2">{toolbar}</div>

      {/* bulk + count */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm text-gray-600">{pagination.total} total</div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteMany(Array.from(selected))}
              className="h-9 rounded-md border px-3"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-3 py-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th className="px-3 py-2">Trip ID</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2">Vehicle</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const driver =
              ScheduleRepo.constants.drivers.find((d) => d.id === r.driverId)
                ?.name ?? "—";
            const vehicle =
              ScheduleRepo.constants.vehicles.find((v) => v.id === r.vehicleId)
                ?.label ?? "—";

            const sStart = canStart(r);
            const sComplete = canComplete(r);
            const sCancel = canCancel(r);
            const sReopen = canReopen(r);

            return (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={(e) => onToggleOne(r.id, e.target.checked)}
                  />
                </td>

                <td className="px-3 py-2">
                  <code className="rounded bg-gray-50 px-1.5 py-0.5">
                    {r.tripId}
                  </code>
                </td>

                <td className="px-3 py-2 font-medium">
                  <span
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer underline-offset-2 hover:underline"
                    onClick={() => onView(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onView(r);
                    }}
                    title="View details"
                  >
                    {r.title}
                  </span>
                </td>

                <td className="px-3 py-2">
                  {r.date} {r.startTime}-{r.endTime}
                </td>

                <td className="px-3 py-2">{driver}</td>
                <td className="px-3 py-2">{vehicle}</td>

                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>

                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onView(r)}
                      className="rounded border px-2 py-1"
                    >
                      View
                    </button>

                    <button
                      disabled={!sStart}
                      onClick={() => onSetStatus(r.id, "ONGOING")}
                      className="rounded border px-2 py-1 disabled:opacity-50"
                    >
                      Start
                    </button>

                    <button
                      disabled={!sComplete}
                      onClick={() => onSetStatus(r.id, "COMPLETED")}
                      className="rounded border px-2 py-1 disabled:opacity-50"
                    >
                      Complete
                    </button>

                    <button
                      disabled={r.status !== "ONGOING"}
                      onClick={() => onSetStatus(r.id, "PLANNED" as any)}
                      className="rounded border px-2 py-1 disabled:opacity-50"
                    >
                      Stop
                    </button>

                    <button
                      disabled={!sCancel}
                      onClick={() => onSetStatus(r.id, "CANCELLED")}
                      className="rounded border px-2 py-1 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      disabled={!sReopen}
                      onClick={() => onSetStatus(r.id, "PLANNED" as any)}
                      className="rounded border px-2 py-1 disabled:opacity-50"
                    >
                      Reopen
                    </button>

                    <button
                      onClick={() => onEdit(r)}
                      className="rounded border px-2 py-1"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-8 text-center text-gray-500"
              >
                No schedules
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm">
          Page {pagination.page} of{" "}
          {Math.ceil(pagination.total / pagination.pageSize)}
        </div>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="h-9 rounded-md border px-3 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={
              pagination.page * pagination.pageSize >= pagination.total
            }
            onClick={() => onPageChange(pagination.page + 1)}
            className="h-9 rounded-md border px-3 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
