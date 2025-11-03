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
  markVisitedNow,
  getReadIds,
  markRead as markReqRead,
  markManyRead,
} from "@/lib/admin/requests/notifs";

import { useRequestsFromSupabase } from "@/lib/admin/requests/useRequestsFromSupabase";

/* helpers -------------------------------------------------- */
type RowStatus = RequestRow["status"];

function normalizeStatus(s: AdminRequest["status"]): RowStatus {
  if (
    s === "pending" ||
    s === "pending_head" ||
    s === "admin_received" ||
    s === "head_approved"
  )
    return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected" || s === "head_rejected" || s === "cancelled") return "Rejected";
  if (s === "completed") return "Completed";
  return "Pending";
}

function toRequestRowLocal(req: AdminRequest): RequestRow {
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

function toRequestRowRemote(r: any): RequestRow {
  const t = r.payload?.travelOrder ?? {};
  return {
    id: r.id,
    dept: t.department || "",
    purpose: t.purposeOfTravel || t.purpose || "",
    requester: t.requestingPerson || "",
    driver: r.driver || "—",
    vehicle: r.vehicle || "—",
    date: r.created_at,
    status: normalizeStatus(r.current_status as any),
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
  const [pagination, setPagination] = useState<Pg>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openDetails, setOpenDetails] = useState(false);
  const [activeRow, setActiveRow] = useState<AdminRequest | undefined>();

  const [draft, setDraft] = useState<FilterState>({
    status: "All",
    dept: "All",
    from: "",
    to: "",
    search: "",
    mode: "auto",
  });

  // remote
  const {
    loading: loadingRemote,
    error: remoteError,
    requests: remoteRequests,
  } = useRequestsFromSupabase();

  // para alam natin kung tapos na talaga yung remote attempt (success OR fail)
  const [remoteSettled, setRemoteSettled] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    markVisitedNow();
  }, []);

  useEffect(() => {
    TrashRepo.purgeOlderThan(30);
  }, []);

  // kapag tumigil na si remote sa pag-load
  useEffect(() => {
    if (!loadingRemote) {
      setRemoteSettled(true);
    }
  }, [loadingRemote]);

  // CASE 1: remote SUCCESS
  useEffect(() => {
    if (loadingRemote) return;
    if (remoteError) return;
    if (!remoteRequests) return;

    const list = remoteRequests
      .filter(
        (r: any) =>
          r.current_status !== "pending_head" && r.current_status !== "head_rejected",
      )
      .map((r: any) => toRequestRowRemote(r));

    setAllRows(list);
    setFilteredRows(list);

    const read = getReadIds();
    const unread = new Set<string>(list.filter((r) => !read.has(r.id)).map((r) => r.id));
    setUnreadIds(unread);
  }, [loadingRemote, remoteError, remoteRequests]);

  // CASE 2: remote FAILED → saka lang mag-local
  useEffect(() => {
    if (!remoteSettled) return;
    if (remoteRequests && !remoteError) return; // may remote, wag na mag-local

    const loadLocal = () => {
      const list = AdminRequestsRepo.list()
        .filter((r) => r.status !== "pending_head" && r.status !== "head_rejected")
        .map(toRequestRowLocal);

      setAllRows(list);
      setFilteredRows(list);

      const read = getReadIds();
      const unread = new Set<string>(
        list.filter((r) => !read.has(r.id)).map((r) => r.id),
      );
      setUnreadIds(unread);
    };

    loadLocal();
    const id = setInterval(loadLocal, 1500);
    return () => clearInterval(id);
  }, [remoteSettled, remoteRequests, remoteError]);

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
      }),
    );
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setDraft({
      status: "All",
      dept: "All",
      from: "",
      to: "",
      search: "",
      mode: "auto",
    });
    setFilteredRows(allRows);
    setSelected(new Set());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ✅ ito yung kailangan ng toolbar
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
            .includes(q),
        )
      : filteredRows;

    return [...searched].sort((a, b) =>
      sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
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
      TrashRepo.addMany(
        items.map((it) => ({ ...it, deletedAt: new Date().toISOString() })),
      );
    }

    const repoAny = AdminRequestsRepo as unknown as {
      remove?: (id: string) => void;
      removeMany?: (ids: string[]) => void;
    };
    if (repoAny.removeMany) repoAny.removeMany(ids);
    else if (repoAny.remove) ids.forEach((id) => repoAny.remove!(id));

    const list = AdminRequestsRepo.list()
      .filter((r) => r.status !== "pending_head" && r.status !== "head_rejected")
      .map(toRequestRowLocal);
    setAllRows(list);
    setFilteredRows(list);
    setSelected(new Set());
    toast({
      message: `Moved ${ids.length} to Trash (kept for 30 days)`,
      kind: "success",
    });
  };

  const summary = useMemo(
    () => ({
      pending: filteredRows.filter((r) => r.status === "Pending").length,
      approved: filteredRows.filter((r) => r.status === "Approved").length,
      completed: filteredRows.filter((r) => r.status === "Completed").length,
      rejected: filteredRows.filter((r) => r.status === "Rejected").length,
    }),
    [filteredRows],
  );

  if (!mounted) return <div />;

  return (
    <div className="space-y-4">
      {loadingRemote && (
        <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Loading requests from Supabase...
        </div>
      )}
      {remoteSettled && remoteError && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-900">
          Failed to load from Supabase. Showing local data.
        </div>
      )}

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
        unreadIds={unreadIds}
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
