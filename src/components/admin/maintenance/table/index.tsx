// src/components/admin/maintenance/table/index.tsx
"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import Pagination from "./Pagination";
import Toolbar from "@/components/admin/maintenance/toolbar/Toolbar";
// ⬇ keep your common UI that actually matches your repo
import EmptyState from "@/components/common/ui/EmptyState.ui";
import SkeletonTable from "@/components/common/ui/SkeletonTable.ui";

export type MaintTableHandle = { getVisibleIds: () => string[] };

type Props = {
  loading?: boolean;
  rows: Maintenance[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onDeleteSelected: () => void;
  onAdd: () => void;
  pageSize?: number;
};

function InnerTable(
  {
    loading = false,
    rows,
    selection,
    setSelection,
    onEdit,
    onDelete,
    onExport,
    onDeleteSelected,
    onAdd,
    pageSize = 10,
  }: Props,
  ref: React.Ref<MaintTableHandle>
) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  React.useEffect(() => { setPage((p) => Math.min(p, totalPages)); }, [rows.length, pageSize, totalPages]);

  const start = (page - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  React.useImperativeHandle(ref, () => ({ getVisibleIds: () => visible.map((r: any) => r.id) }), [visible]);

  const allOnPageSelected = visible.length > 0 && visible.every((r: any) => selection.includes(r.id));
  const toggleSelectAllOnPage = (checked: boolean) => {
    if (!visible.length) return;
    if (checked) {
      const merged = new Set([...selection, ...visible.map((r: any) => r.id)]);
      setSelection(Array.from(merged));
    } else {
      const minus = new Set(selection);
      visible.forEach((r: any) => minus.delete(r.id));
      setSelection(Array.from(minus));
    }
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between p-3">
        <h2 className="text-base font-semibold">Maintenance Records</h2>
        <Toolbar
          selectionCount={selection.length}
          onExport={onExport}
          onDeleteSelected={onDeleteSelected}
          onAdd={onAdd}
        />
      </div>

      {loading ? (
        <div className="p-3">
          <SkeletonTable rows={6} cols={8} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No maintenance records"
          description="Try adjusting your filters or add a new record."
          action={
            <button
              onClick={onAdd}
              className="rounded-xl px-4 py-2 bg-[#7a0019] text-white hover:brightness-110"
            >
              Add Maintenance
            </button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-sm">
              <TableHeader allOnPageSelected={allOnPageSelected} onToggleAll={toggleSelectAllOnPage} />
              <tbody>
                {visible.map((r: any) => (
                  <TableRow
                    key={r.id}
                    row={r}
                    checked={selection.includes(r.id)}
                    onToggle={() => {
                      const s = new Set(selection);
                      s.has(r.id) ? s.delete(r.id) : s.add(r.id);
                      setSelection(Array.from(s));
                    }}
                    onEdit={() => onEdit(r.id)}
                    onDelete={() => onDelete(r.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            total={rows.length}
            pageSize={pageSize}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      )}
    </div>
  );
}

const Table = React.forwardRef(InnerTable);
export default Table;
