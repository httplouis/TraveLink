// src/app/(protected)/admin/requests/PageInner.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";
import RequestsSummaryUI from "@/components/admin/requests/ui/RequestsSummary.ui";
import RequestsTableUI from "@/components/admin/requests/ui/RequestsTable.ui";
import RequestsCardGridUI from "@/components/admin/requests/ui/RequestsCardGrid.ui";
import RequestDetailsModalUI from "@/components/admin/requests/ui/RequestDetailsModal.ui";
import ViewToggleUI from "@/components/admin/requests/ui/ViewToggle.ui";

import FiltersBarContainer from "@/components/admin/requests/containers/FiltersBar.container";
import { RequestsURLSync } from "./RequestsURLSync";

import { useDebouncedValue } from "@/lib/common/useDebouncedValue";
import {
  toggleAllOnPage as selToggleAllOnPage,
  clearSelection as selClear,
} from "@/lib/common/selection";

import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";
import type { RequestRow, Pagination as Pg } from "@/lib/admin/types";

/* ========== Mapper ========== */
function toRequestRow(req: AdminRequest): RequestRow {
  return {
    id: req.id,
    dept: req.travelOrder?.department || "",
    purpose: req.travelOrder?.purposeOfTravel || "",
    requester: req.travelOrder?.requestingPerson || "",
    driver: req.driver || "—",
    vehicle: req.vehicle || "—",
    date: req.createdAt,
    status:
      req.status === "pending"
        ? "Pending"
        : req.status === "approved"
        ? "Approved"
        : req.status === "rejected"
        ? "Rejected"
        : "Completed",
  };
}

/* ========== Main Component ========== */
export default function PageInner() {
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [allRows, setAllRows] = useState<RequestRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const debouncedQ = useDebouncedValue(tableSearch, 300);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [view, setView] = useState<"table" | "card">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const PAGE_SIZES = { table: 15, card: 9 } as const;
  const [pagination, setPagination] = useState<Pg>({
    page: 1,
    pageSize: PAGE_SIZES.table,
    total: 0,
  });

  const [openDetails, setOpenDetails] = useState(false);
  const [activeRow, setActiveRow] = useState<AdminRequest | undefined>();

  // hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // sync rows
  useEffect(() => {
    setAllRows(AdminRequestsRepo.list().map(toRequestRow));
    const interval = setInterval(() => {
      setAllRows(AdminRequestsRepo.list().map(toRequestRow));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => setFilteredRows(allRows), [allRows]);

  const postFilterRows = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const searched = q
      ? filteredRows.filter((r) =>
          [r.id, r.purpose, r.dept, r.requester ?? "", r.driver ?? "", r.vehicle ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : filteredRows;

    return [...searched].sort((a, b) =>
      sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  }, [filteredRows, debouncedQ, sortDir]);

  const clearSelection = () => selClear(setSelected);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1, pageSize: PAGE_SIZES[view] }));
    clearSelection();
  }, [view]);

  useEffect(() => {
    setPagination((p) => {
      const total = postFilterRows.length;
      const maxPage = Math.max(1, Math.ceil(total / p.pageSize) || 1);
      return { ...p, total, page: Math.min(p.page, maxPage) };
    });
    clearSelection();
  }, [postFilterRows]);

  const pageRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return postFilterRows.slice(start, start + pagination.pageSize);
  }, [postFilterRows, pagination.page, pagination.pageSize]);

  const openRow = (r: RequestRow) => {
    const full = AdminRequestsRepo.get(r.id);
    if (full) setActiveRow(full);
    setOpenDetails(true);
  };

  const summary = useMemo(
    () => ({
      pending: filteredRows.filter((r) => r.status === "Pending").length,
      approved: filteredRows.filter((r) => r.status === "Approved").length,
      completed: filteredRows.filter((r) => r.status === "Completed").length,
      rejected: filteredRows.filter((r) => r.status === "Rejected").length,
    }),
    [filteredRows]
  );

  // ✅ hydration-safe return
  if (!mounted) return <div />;

  return (
    <div className="space-y-4">
      <div className="admin-sticky-kpi">
        <div className="space-y-2 pr-2">
          <RequestsSummaryUI summary={summary} />
          <div className="flex justify-end">
            <ViewToggleUI view={view} onChange={setView} />
          </div>
        </div>
      </div>

      <FiltersBarContainer rows={allRows} onFiltered={setFilteredRows}>
        {(controls) => (
          <>
            <RequestsURLSync draft={controls.draft} onDraftChange={controls.onDraftChange} />

            {view === "table" && (
              <RequestsTableUI
                rows={pageRows}
                tableSearch={tableSearch}
                onTableSearch={setTableSearch}
                sortDir={sortDir}
                onSortDirChange={setSortDir}
                pagination={pagination}
                selectedIds={selected}
                onToggleOne={(id) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  })
                }
                onToggleAllOnPage={(checked, idsOnPage) =>
                  selToggleAllOnPage(setSelected, idsOnPage, checked)
                }
                onRowClick={openRow}
                onRowViewDetails={(row) => openRow(row)}
                onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                onPageSizeChange={(pageSize) =>
                  setPagination((p) => ({ ...p, page: 1, pageSize }))
                }
                filterControls={{
                  draft: controls.draft,
                  onDraftChange: controls.onDraftChange,
                  onApply: controls.onApply,
                  onClearAll: controls.onClearAll,
                }}
              />
            )}

            {view === "card" && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <RequestsCardGridUI
                  rows={pageRows}
                  pagination={pagination}
                  onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                  selectedIds={selected}
                  onToggleOne={(id) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    })
                  }
                  onRowClick={openRow}
                />
              </div>
            )}
          </>
        )}
      </FiltersBarContainer>

      <RequestDetailsModalUI
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        row={activeRow}
      />

      <ConfirmUI
        open={false}
        title="Confirm"
        message="Confirm action"
        confirmText="OK"
        confirmClass="bg-green-600 text-white"
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    </div>
  );
}
