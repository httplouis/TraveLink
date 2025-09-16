"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RequestRow, Pagination } from "@/lib/admin/types";

import ToastProvider, { useToast } from "@/components/common/ToastProvider";
import RequestsSummaryUI from "@/components/admin/requests/ui/RequestsSummary.ui";
import FiltersBarContainer from "@/components/admin/requests/containers/FiltersBar.container";
import BulkBarContainer, { BulkBarHandle } from "@/components/admin/requests/containers/BulkBar.container";

import RequestsTableUI from "@/components/admin/requests/ui/RequestsTable.ui";
import RequestsCardGridUI from "@/components/admin/requests/ui/RequestsCardGrid.ui";
import ViewToggleUI from "@/components/admin/requests/ui/ViewToggle.ui";

import RequestDetailsModalUI from "@/components/admin/requests/ui/RequestDetailsModal.ui";
import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";

import { exportRequestsCsv } from "@/lib/admin/export";
import { approveRequests, rejectRequests, deleteRequests } from "@/lib/admin/requests/action";
import { REQUESTS } from "@/lib/admin/requests/data";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ---------- tiny debounce hook ---------- */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ---------- URL <-> UI sync (search, filters, sort) ---------- */
function URLSync({
  draft,
  onDraftChange,
  tableSearch,
  setTableSearch,
  sortDir,
  setSortDir,
}: {
  draft: any;
  onDraftChange: (n: Partial<any>) => void;
  tableSearch: string;
  setTableSearch: (v: string) => void;
  sortDir: "asc" | "desc";
  setSortDir: (v: "asc" | "desc") => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didInit = useRef(false);

  // On mount: read URL -> state
  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());

    const q = p.get("q") ?? "";
    const status = (p.get("status") as any) || undefined;
    const dept = (p.get("dept") as any) || undefined;
    const from = p.get("from") || "";
    const to = p.get("to") || "";
    const mode = (p.get("mode") as "auto" | "apply") || undefined;
    const sd = p.get("sort");

    if (q) setTableSearch(q);

    const patch: Record<string, any> = {};
    if (status) patch.status = status;
    if (dept) patch.dept = dept;
    if (from) patch.from = from;
    if (to) patch.to = to;
    if (mode) patch.mode = mode;
    if (Object.keys(patch).length) onDraftChange(patch);

    if (sd === "asc" || sd === "desc") setSortDir(sd);

    didInit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On state change: write state -> URL (omit defaults)
  useEffect(() => {
    if (!didInit.current) return;

    const params = new URLSearchParams();
    if (tableSearch.trim()) params.set("q", tableSearch.trim());
    if (draft.status && draft.status !== "All") params.set("status", String(draft.status));
    if (draft.dept && draft.dept !== "All") params.set("dept", String(draft.dept));
    if (draft.from) params.set("from", String(draft.from));
    if (draft.to) params.set("to", String(draft.to));
    if (draft.mode && draft.mode !== "auto") params.set("mode", String(draft.mode));
    if (sortDir === "asc") params.set("sort", "asc"); // default is 'desc'

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [draft, tableSearch, sortDir, pathname, router]);

  return null;
}

function PageInner() {
  const toast = useToast();
  const bulkRef = useRef<BulkBarHandle>(null);

  /* SOURCE rows (mock) */
  const [allRows, setAllRows] = useState<RequestRow[]>(() => [...REQUESTS]);

  /* FILTERED rows (from FiltersBarContainer) */
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>(() => allRows);
  useEffect(() => setFilteredRows(allRows), [allRows]);

  /* LOCAL table/card search + sort (applied after Filters) */
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

  /* VIEW TOGGLE */
  const [view, setView] = useState<"table" | "card">("table");

  /* SELECTION (shared across views) */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clearSelection = () => setSelected(new Set());

  /* PAGINATION (table 15/page; card 9/page) */
  const PAGE_SIZES = { table: 15, card: 9 } as const;
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZES.table,
    total: postFilterRows.length,
  });

  // when view changes
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1, pageSize: PAGE_SIZES[view] }));
    clearSelection();
  }, [view]);

  // keep pagination with rows
  useEffect(() => {
    setPagination((p) => {
      const total = postFilterRows.length;
      const maxPage = Math.max(1, Math.ceil(total / p.pageSize) || 1);
      return { ...p, total, page: Math.min(p.page, maxPage) };
    });
    clearSelection();
  }, [postFilterRows]);

  // measure sticky offsets → CSS vars
  useEffect(() => {
  const selKpi = '[data-role="admin"] .admin-sticky-kpi';
  const selTb  = '[data-role="admin"] .admin-sticky-toolbar';

  function update() {
    const kpi = document.querySelector(selKpi) as HTMLElement | null;
    const tb  = document.querySelector(selTb)  as HTMLElement | null;

    const kpiH = kpi?.offsetHeight ?? 0;
    const tbH  = tb?.offsetHeight ?? 0;

    const root = document.querySelector('[data-role="admin"]') as HTMLElement | null;
    if (root) {
      root.style.setProperty("--rq-kpi", `${kpiH}px`);
      root.style.setProperty("--rq-toolbar", `${tbH}px`);
      root.style.setProperty("--rq-offset", `${kpiH + tbH}px`);
    }
  }

  update();
  window.addEventListener("resize", update);

  const obs = new MutationObserver(update);
  const kpiNode = document.querySelector(selKpi);
  const tbNode  = document.querySelector(selTb);
  if (kpiNode) obs.observe(kpiNode, { childList: true, subtree: true, attributes: true });
  if (tbNode)  obs.observe(tbNode,  { childList: true, subtree: true, attributes: true });

  return () => { window.removeEventListener("resize", update); obs.disconnect(); };
}, []);

  const pageRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return postFilterRows.slice(start, start + pagination.pageSize);
  }, [postFilterRows, pagination.page, pagination.pageSize]);

  /* DETAILS + CONFIRM */
  const [openDetails, setOpenDetails] = useState(false);
  const [activeRow, setActiveRow] = useState<RequestRow | undefined>();
  const openRow = (r: RequestRow) => {
    setActiveRow(r);
    setOpenDetails(true);
  };

  const [confirm, setConfirm] = useState<{ open: boolean; kind?: "approve" | "reject"; id?: string }>({ open: false });

  /* ---------- PATCH HELPERS (optimistic) ---------- */
  function patchStatus(ids: string[], status?: "Approved" | "Rejected") {
    setAllRows((prev) => (status ? prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)) : prev.filter((r) => !ids.includes(r.id))));
    setFilteredRows((prev) => (status ? prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)) : prev.filter((r) => !ids.includes(r.id))));
  }

  async function approveOne(id: string) {
    const snapAll = [...allRows];
    const snapFiltered = [...filteredRows];
    patchStatus([id], "Approved");
    try {
      await approveRequests([id]);
      toast({ kind: "success", message: `Request ${id} approved.` });
    } catch {
      setAllRows(snapAll);
      setFilteredRows(snapFiltered);
      toast({ kind: "error", message: `Failed to approve ${id}.` });
    }
  }

  async function rejectOne(id: string) {
    const snapAll = [...allRows];
    const snapFiltered = [...filteredRows];
    patchStatus([id], "Rejected");
    try {
      await rejectRequests([id]);
      toast({ kind: "success", message: `Request ${id} rejected.` });
    } catch {
      setAllRows(snapAll);
      setFilteredRows(snapFiltered);
      toast({ kind: "error", message: `Failed to reject ${id}.` });
    }
  }

  const doConfirm = async () => {
    const id = confirm.id!;
    if (confirm.kind === "approve") await approveOne(id);
    if (confirm.kind === "reject") await rejectOne(id);
    setConfirm({ open: false });
    setOpenDetails(false);
  };

  /* ---------- BULK ---------- */
  async function bulkApprove(ids: string[]) {
    if (!ids.length) return;
    const snapAll = [...allRows];
    const snapFiltered = [...filteredRows];
    patchStatus(ids, "Approved");
    try {
      await approveRequests(ids);
      toast({ kind: "success", message: `Approved ${ids.length} selected.` });
    } catch {
      setAllRows(snapAll);
      setFilteredRows(snapFiltered);
      toast({ kind: "error", message: "Failed to approve selected." });
    }
  }

  async function bulkReject(ids: string[]) {
    if (!ids.length) return;
    const snapAll = [...allRows];
    const snapFiltered = [...filteredRows];
    patchStatus(ids, "Rejected");
    try {
      await rejectRequests(ids);
      toast({ kind: "success", message: `Rejected ${ids.length} selected.` });
    } catch {
      setAllRows(snapAll);
      setFilteredRows(snapFiltered);
      toast({ kind: "error", message: "Failed to reject selected." });
    }
  }

  async function bulkDelete(ids: string[]) {
    if (!ids.length) return;
    const snapAll = [...allRows];
    const snapFiltered = [...filteredRows];
    patchStatus(ids, undefined);
    try {
      await deleteRequests(ids);
      toast({ kind: "success", message: `Deleted ${ids.length} selected.` });
    } catch {
      setAllRows(snapAll);
      setFilteredRows(snapFiltered);
      toast({ kind: "error", message: "Failed to delete selected." });
    }
  }

  function bulkExport(rows: RequestRow[]) {
    try {
      exportRequestsCsv(rows);
      toast({ kind: "success", message: `Exported ${rows.length} row(s).` });
    } catch {
      toast({ kind: "error", message: "Export failed." });
    }
  }

  /* ---------- Keyboard shortcuts (with typing guard) ---------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      const typing =
        (t && (t as HTMLElement).isContentEditable) ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select";
      if (typing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        bulkRef.current?.approveSelected();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected((prev) => new Set([...prev, ...pageRows.map((r) => r.id)]));
        return;
      }
      if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        clearSelection();
        return;
      }
      if (e.key === "ArrowLeft") {
        setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }));
        return;
      }
      if (e.key === "ArrowRight") {
        setPagination((p) => ({
          ...p,
          page: Math.min(Math.ceil(p.total / p.pageSize) || 1, p.page + 1),
        }));
        return;
      }
      if (e.key.toLowerCase() === "t") {
        setView("table");
        return;
      }
      if (e.key.toLowerCase() === "c") {
        setView("card");
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageRows]);

  /* KPI summary uses filteredRows (pre-search) */
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
      {/* Sticky KPI + View toggle */}
<div className="admin-sticky-kpi">
  {/* stack the cards and the toggle with spacing + a bit of right padding */}
  <div className="space-y-2 pr-2">
    <RequestsSummaryUI summary={summary} />
    <div className="flex justify-end">
      <ViewToggleUI view={view} onChange={setView} />
    </div>
  </div>
</div>


      {/* Filters container provides filtering logic to both views */}
      <FiltersBarContainer rows={allRows} onFiltered={setFilteredRows}>
        {(controls) => (
          <>
            {/* URL sync */}
            <URLSync
              draft={controls.draft}
              onDraftChange={controls.onDraftChange}
              tableSearch={tableSearch}
              setTableSearch={setTableSearch}
              sortDir={sortDir}
              setSortDir={setSortDir}
            />

            {/* Bulk bar */}
            {selected.size > 0 && (
              <BulkBarContainer
                ref={bulkRef}
                allRows={postFilterRows}
                selectedIds={selected}
                clearSelection={clearSelection}
                onApproveSelected={bulkApprove}
                onRejectSelected={bulkReject}
                onDeleteSelected={bulkDelete}
                onExportSelected={bulkExport}
              />
            )}

            {/* TABLE VIEW */}
            {view === "table" && (
              <RequestsTableUI
                tableSearch={tableSearch}
                onTableSearch={setTableSearch}
                sortDir={sortDir}
                onSortDirChange={setSortDir}
                onAddNew={() => toast({ kind: "success", message: "Add New clicked" })}
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
                onToggleAllOnPage={(checked, idsOnPage) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    idsOnPage.forEach((id) => (checked ? next.add(id) : next.delete(id)));
                    return next;
                  })
                }
                onRowClick={openRow}
                onRowViewDetails={(row) => openRow(row)}
                onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, page: 1, pageSize }))}
                onApproveRow={(id) => approveOne(id)}
                onRejectRow={(id) => rejectOne(id)}
              />
            )}

            {/* CARD VIEW */}
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

export default function AdminRequestsPage() {
  return (
    <ToastProvider>
      <PageInner />
    </ToastProvider>
  );
}
