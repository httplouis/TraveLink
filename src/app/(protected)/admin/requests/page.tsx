"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* UI */
import ToastProvider, { useToast } from "@/components/common/ui/ToastProvider.ui";
import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";
import RequestsSummaryUI from "@/components/admin/requests/ui/RequestsSummary.ui";
import RequestsTableUI from "@/components/admin/requests/ui/RequestsTable.ui";
import RequestsCardGridUI from "@/components/admin/requests/ui/RequestsCardGrid.ui";
import RequestDetailsModalUI from "@/components/admin/requests/ui/RequestDetailsModal.ui";
import ViewToggleUI from "@/components/admin/requests/ui/ViewToggle.ui";

/* Containers */
import FiltersBarContainer from "@/components/admin/requests/containers/FiltersBar.container";
import BulkBarContainer, { BulkBarHandle } from "@/components/admin/requests/containers/BulkBar.container";

/* URL-sync (filters-only, named export) */
import { RequestsURLSync } from "./RequestsURLSync";

/* Logic & utils */
import { useHotkeys } from "@/lib/common/useHotkeys";
import { clampPage } from "@/lib/common/pagination";
import { useDebouncedValue } from "@/lib/common/useDebouncedValue";
import { toggleAllOnPage as selToggleAllOnPage, clearSelection as selClear } from "@/lib/common/selection";

/* Data + Actions */
import { approveRequests, rejectRequests, deleteRequests } from "@/lib/admin/requests/action";
import { exportRequestsCsv } from "@/lib/admin/export";

/* Repo */
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";

/* Types */
import type { RequestRow, Pagination as Pg } from "@/lib/admin/types";

/* ======================================================================= */
/* =========================== HELPER MAPPER ============================== */
/* ======================================================================= */

function toRequestRow(req: AdminRequest): RequestRow {
  return {
    id: req.id,
    dept: req.travelOrder?.department || "",
    purpose: req.travelOrder?.purposeOfTravel || "",
    requester: req.travelOrder?.requestingPerson || "",
    driver: "", // wala pa sa form
    vehicle: "", // wala pa sa form
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

/* ======================================================================= */
/* =========================== INNER PAGE LOGIC =========================== */
/* ======================================================================= */

function PageInner() {
  const toast = useToast();
  const bulkRef = useRef<BulkBarHandle>(null);

  // SOURCE rows (from repo)
  const [allRows, setAllRows] = useState<RequestRow[]>(() =>
    AdminRequestsRepo.list().map(toRequestRow)
  );

  // Auto-refresh every 1s (polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setAllRows(AdminRequestsRepo.list().map(toRequestRow));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // FILTERED rows
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>(() => allRows);
  useEffect(() => setFilteredRows(allRows), [allRows]);

  // LOCAL search + sort
  const [tableSearch, setTableSearch] = useState("");
  const debouncedQ = useDebouncedValue(tableSearch, 300);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const postFilterRows = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const searched = q
      ? filteredRows.filter((r) => {
          const s = [r.id, r.purpose, r.dept, r.requester ?? "", r.driver ?? "", r.vehicle ?? ""]
            .join(" ")
            .toLowerCase();
          return s.includes(q);
        })
      : filteredRows;

    return [...searched].sort((a, b) =>
      sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  }, [filteredRows, debouncedQ, sortDir]);

  // VIEW TOGGLE
  const [view, setView] = useState<"table" | "card">("table");

  // SELECTION
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clearSelection = () => selClear(setSelected);

  // PAGINATION
  const PAGE_SIZES = { table: 15, card: 9 } as const;
  const [pagination, setPagination] = useState<Pg>({
    page: 1,
    pageSize: PAGE_SIZES.table,
    total: postFilterRows.length,
  });

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

  // DETAILS + CONFIRM
  const [openDetails, setOpenDetails] = useState(false);
  const [activeRow, setActiveRow] = useState<RequestRow | undefined>();
  const openRow = (r: RequestRow) => {
    setActiveRow(r);
    setOpenDetails(true);
  };

  const [confirm, setConfirm] = useState<{ open: boolean; kind?: "approve" | "reject"; id?: string }>({ open: false });

  // ---------- PATCH HELPERS ----------
  function patchStatus(ids: string[], status?: "Approved" | "Rejected" | "Completed") {
    setAllRows((prev) =>
      status ? prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)) : prev.filter((r) => !ids.includes(r.id))
    );
    setFilteredRows((prev) =>
      status ? prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)) : prev.filter((r) => !ids.includes(r.id))
    );
  }

  async function approveOne(id: string) {
    patchStatus([id], "Approved");
    AdminRequestsRepo.setStatus(id, "approved");
    toast({ kind: "success", message: `Request ${id} approved.` });
  }

  async function rejectOne(id: string) {
    patchStatus([id], "Rejected");
    AdminRequestsRepo.setStatus(id, "rejected");
    toast({ kind: "success", message: `Request ${id} rejected.` });
  }

  const doConfirm = async () => {
    const id = confirm.id!;
    if (confirm.kind === "approve") await approveOne(id);
    if (confirm.kind === "reject") await rejectOne(id);
    setConfirm({ open: false });
    setOpenDetails(false);
  };

  // KPI summary
  const summary = useMemo(
    () => ({
      pending: filteredRows.filter((r) => r.status === "Pending").length,
      approved: filteredRows.filter((r) => r.status === "Approved").length,
      completed: filteredRows.filter((r) => r.status === "Completed").length,
      rejected: filteredRows.filter((r) => r.status === "Rejected").length,
    }),
    [filteredRows]
  );

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
                tableSearch={tableSearch}
                onTableSearch={setTableSearch}
                sortDir={sortDir}
                onSortDirChange={setSortDir}
                onAddNew={() => toast({ kind: "info", message: "Feature not available in admin" })}
                filterControls={{
                  draft: controls.draft,
                  onDraftChange: controls.onDraftChange,
                  onApply: controls.onApply,
                  onClearAll: controls.onClearAll,
                }}
                rows={pageRows}
                pagination={pagination}
                selectedIds={selected}
                onToggleOne={(id) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  })
                }
                onToggleAllOnPage={(checked, idsOnPage) => selToggleAllOnPage(setSelected, idsOnPage, checked)}
                onRowClick={openRow}
                onRowViewDetails={(row) => openRow(row)}
                onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, page: 1, pageSize }))}
                onApproveRow={(id) => approveOne(id)}
                onRejectRow={(id) => rejectOne(id)}
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
                  onApproveRow={(id) => approveOne(id)}
                  onRejectRow={(id) => rejectOne(id)}
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
        onApprove={() => activeRow && setConfirm({ open: true, kind: "approve", id: activeRow.id })}
        onReject={() => activeRow && setConfirm({ open: true, kind: "reject", id: activeRow.id })}
      />

      <ConfirmUI
        open={confirm.open}
        title={confirm.kind === "approve" ? "Approve request?" : "Reject request?"}
        message={confirm.kind === "approve" ? "This will mark the request as Approved." : "This will mark the request as Rejected."}
        confirmText={confirm.kind === "approve" ? "Approve" : "Reject"}
        confirmClass={confirm.kind === "approve" ? "bg-green-600 text-white" : "bg-red-600 text-white"}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={doConfirm}
      />
    </div>
  );
}

/* ======================================================================= */
/* ============================== PAGE WRAP =============================== */
/* ======================================================================= */

export default function AdminRequestsPage() {
  return (
    <ToastProvider>
      <PageInner />
    </ToastProvider>
  );
}
