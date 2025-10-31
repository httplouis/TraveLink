// src/app/(protected)/admin/requests/PageInner.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";
import RequestsSummaryUI from "@/components/admin/requests/ui/RequestsSummary.ui";
import RequestsReceiverViewUI from "@/components/admin/requests/ui/RequestsReceiverView.ui";
import RequestDetailsModalUI from "@/components/admin/requests/ui/RequestDetailsModal.ui";
import RequestsToolbarUI from "@/components/admin/requests/toolbar/RequestsToolbar.ui";

import { useDebouncedValue } from "@/lib/common/useDebouncedValue";
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";
import type { RequestRow, Pagination as Pg, FilterState } from "@/lib/admin/types";
import * as TrashRepo from "@/lib/admin/requests/trashRepo";
import {
  markVisitedNow,           // keep for badge
  getReadIds,               // highlight uses this
  markRead as markReqRead,
  markManyRead,
} from "@/lib/admin/requests/notifs";

/* ---------- row mapper ---------- */
type RowStatus = RequestRow["status"]; // typically "Pending" | "Approved" | "Rejected" | "Completed"

function normalizeStatus(s: AdminRequest["status"]): RowStatus {
  if (
    s === "pending" ||
    s === "pending_head" ||
    s === "admin_received" ||
    s === "head_approved"
  ) return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected" || s === "head_rejected" || s === "cancelled") return "Rejected";
  if (s === "completed") return "Completed";
  // Fallback: treat unknowns as Pending
  return "Pending";
}

function toRequestRow(req: AdminRequest): RequestRow {
  const t = req.travelOrder as any;

  return {
    id: req.id,
    dept: t?.department || "",
    purpose: t?.purposeOfTravel || t?.purpose || "",
    requester: t?.requestingPerson || "",
    driver: req.driver || "—",
    vehicle: req.vehicle || "—",
    date: req.createdAt,
    status: normalizeStatus(req.status),
  };
}

const PAGE_SIZE = 12;

export default function PageInner() {
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [allRows, setAllRows] = useState<RequestRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const [tableSearch, setTableSearch] = useState("");
  const debouncedQ = useDebouncedValue(tableSearch, 300);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [pagination, setPagination] = useState<Pg>({ page: 1, pageSize: PAGE_SIZE, total: 0 });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openDetails, setOpenDetails] = useState(false);
  const [activeRow, setActiveRow] = useState<AdminRequest | undefined>();

  const [draft, setDraft] = useState<FilterState>({
    status: "All", dept: "All", from: "", to: "", search: "", mode: "auto",
  });

  useEffect(() => setMounted(true), []);

  // Keep this so the LEFT-NAV badge resets when you visit the page
  useEffect(() => { markVisitedNow(); }, []);

  useEffect(() => { TrashRepo.purgeOlderThan(30); }, []);

  // Poll list; highlight = ids NOT in the read set (doesn't clear on page view)
  // Admin view hides items awaiting head endorsement and those rejected by head.
  useEffect(() => {
    const load = () => {
      const list = AdminRequestsRepo.list()
        .filter(r => r.status !== "pending_head" && r.status !== "head_rejected");
      setAllRows(list.map(toRequestRow));

      const read = getReadIds();
      const unread = new Set(list.filter(r => !read.has(r.id)).map(r => r.id));
      setUnreadIds(unread);
    };
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setFilteredRows(allRows), [allRows]);

  const applyFilters = () => {
    setSelected(new Set());
    setFilteredRows(
      allRows.filter((r) => {
        const okStatus = draft.status === "All" || r.status === draft.status;
        const okDept = draft.dept === "All" || r.dept === draft.dept;
        const created = new Date(r.date);
        const fromOk = !draft.from || created >= new Date(draft.from);
        const toOk = !draft.to || created <= new Date(draft.to);
        return okStatus && okDept && fromOk && toOk;
      })
    );
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setDraft({ status: "All", dept: "All", from: "", to: "", search: "", mode: "auto" });
    setFilteredRows(allRows);
    setSelected(new Set());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleDraftChange = (patch: Partial<FilterState>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (next.mode === "auto") queueMicrotask(applyFilters);
      return next;
    });
  };

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

  useEffect(() => {
    setPagination((p) => {
      const total = postFilterRows.length;
      const maxPage = Math.max(1, Math.ceil(total / p.pageSize) || 1);
      return { ...p, total, page: Math.min(p.page, maxPage) };
    });
  }, [postFilterRows]);

  const pageRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return postFilterRows.slice(start, start + pagination.pageSize);
  }, [postFilterRows, pagination.page, pagination.pageSize]);

  const markOneRead = (id: string) => {
    markReqRead(id);
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const openRow = (r: RequestRow) => {
    const full = AdminRequestsRepo.get(r.id);
    if (full) setActiveRow(full);
    // Only mark as read when the user actually opened the details
    markOneRead(r.id);
    setOpenDetails(true);
  };

  const onToggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onToggleAllOnPage = (checked: boolean, idsOnPage: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      idsOnPage.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const markSelectedRead = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    markManyRead(ids);
    setUnreadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setSelected(new Set());
    toast({ message: "Marked as read", kind: "success" });
  };

  const deleteSelected = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    const items = ids
      .map((id) => AdminRequestsRepo.get(id))
      .filter(Boolean) as AdminRequest[];

    if (items.length) {
      TrashRepo.addMany(items.map((it) => ({ ...it, deletedAt: new Date().toISOString() })));
    }

    const repoAny = AdminRequestsRepo as unknown as {
      remove?: (id: string) => void;
      removeMany?: (ids: string[]) => void;
    };
    if (repoAny.removeMany) repoAny.removeMany(ids);
    else if (repoAny.remove) ids.forEach((id) => repoAny.remove!(id));

    // Recompute after deletion with the same hide rules
    const list = AdminRequestsRepo.list()
      .filter(r => r.status !== "pending_head" && r.status !== "head_rejected");
    setAllRows(list.map(toRequestRow));

    setSelected(new Set());
    toast({ message: `Moved ${ids.length} to Trash (kept for 30 days)`, kind: "success" });
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

  if (!mounted) return <div />;

  return (
    <div className="space-y-4">
      <div className="space-y-2 pr-2">
        <RequestsSummaryUI summary={summary} />
      </div>

      <RequestsToolbarUI
        tableSearch={tableSearch}
        onTableSearch={setTableSearch}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        onAddNew={() => toast({ message: "Add New clicked!", kind: "success" })}
        draft={draft}
        onDraftChange={handleDraftChange}
        onApply={applyFilters}
        onClearAll={clearFilters}
        selectedCount={selected.size}
        onDeleteSelected={deleteSelected}
        onMarkSelectedRead={markSelectedRead}
      />

      <RequestsReceiverViewUI
        rows={pageRows}
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onRowClick={openRow}
        selectedIds={selected}
        onToggleOne={onToggleOne}
        onToggleAllOnPage={onToggleAllOnPage}
        unreadIds={unreadIds}    // highlight driven by read-set now
        onMarkRead={markOneRead}
      />

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
