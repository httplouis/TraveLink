"use client";
import * as React from "react";
import type { Maintenance, MaintStatus } from "@/lib/admin/maintenance/types";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

export type MaintTableHandle = { getVisibleIds: () => string[] };

type Props = {
  loading: boolean;
  rows: Maintenance[];
  selection: string[];
  setSelection: (next: string[]) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onDeleteSelected: () => void;
  onAdd: () => void;
  onSeedDemo?: () => void;     // optional extra buttons
  onClearAll?: () => void;
  pageSize?: number;
  onChangeStatus: (id: string, s: MaintStatus) => void;
};

const MaintTable = React.forwardRef<MaintTableHandle, Props>(function MaintTable(
  {
    loading,
    rows,
    selection,
    setSelection,
    onView,
    onEdit,
    onDelete,
    onExport,
    onDeleteSelected,
    onAdd,
    onSeedDemo,
    onClearAll,
    pageSize = 10,
    onChangeStatus,
  },
  ref
) {
  const [page, setPage] = React.useState(1);
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  React.useImperativeHandle(
    ref,
    () => ({
      getVisibleIds: () => pageRows.map((r) => r.id),
    }),
    [pageRows]
  );

  const toggleOne = (id: string, checked: boolean) => {
    const set = new Set(selection);
    checked ? set.add(id) : set.delete(id);
    setSelection([...set]);
  };
  const toggleAllOnPage = (checked: boolean) => {
    const set = new Set(selection);
    pageRows.forEach((r) => (checked ? set.add(r.id) : set.delete(r.id)));
    setSelection([...set]);
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{rows.length}</span> records
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSeedDemo && (
            <button onClick={onSeedDemo} className="h-9 rounded-md px-3 text-sm border border-neutral-300 hover:bg-neutral-100">
              Seed demo (random)
            </button>
          )}
          {onClearAll && (
            <button onClick={onClearAll} className="h-9 rounded-md px-3 text-sm border border-neutral-300 hover:bg-neutral-100">
              Clear all
            </button>
          )}
          <button onClick={onExport} className="h-9 rounded-md px-3 text-sm border border-neutral-300 hover:bg-neutral-100">
            Export CSV
          </button>
          <button onClick={onDeleteSelected} className="h-9 rounded-md px-3 text-sm border border-neutral-300 hover:bg-neutral-100">
            Delete Selected
          </button>
          <button onClick={onAdd} className="h-9 rounded-md px-3 text-sm text-white bg-[#7a1f2a] hover:bg-[#6b1b25]">
            + Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[60vh] overflow-auto">
        <table className="min-w-full text-sm text-neutral-800">
          <TableHeader />
          <tbody>
            {pageRows.map((r) => (
              <TableRow
                key={r.id}
                r={r}
                checked={selection.includes(r.id)}
                onCheck={toggleOne}
                onChangeStatus={onChangeStatus}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center text-neutral-500">
                  No results. Adjust filters or add a record.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-neutral-500">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50/50">
        <div className="text-xs text-neutral-500">
          Page <span className="font-medium text-neutral-700">{page}</span> of{" "}
          <span className="font-medium text-neutral-700">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 rounded-md px-3 text-xs border border-neutral-300 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 rounded-md px-3 text-xs border border-neutral-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
});

export default MaintTable;
