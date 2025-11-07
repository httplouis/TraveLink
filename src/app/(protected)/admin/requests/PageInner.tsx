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
    s === "pending_admin" ||
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
  // New schema: data is directly on request object, not in payload
  return {
    id: r.id,
    dept: r.department?.name || r.department?.code || "",
    purpose: r.purpose || "",
    requester: r.requester?.name || r.requester?.email || "",
    driver: r.assigned_driver_id || "—",
    vehicle: r.assigned_vehicle_id || "—",
    date: r.created_at,
    status: normalizeStatus(r.status as any),
  };
}

const PAGE_SIZE = 12;

export default function PageInner() {
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  
  // Tab system for Pending vs History
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const [allRows, setAllRows] = useState<RequestRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>([]);
  const [historyRows, setHistoryRows] = useState<RequestRow[]>([]);
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
  // Use JSON stringify of IDs to prevent infinite loop from array reference changes
  const remoteRequestIds = useMemo(
    () => JSON.stringify(remoteRequests?.map((r: any) => r.id) || []),
    [remoteRequests]
  );

  useEffect(() => {
    if (loadingRemote) return;
    if (remoteError) return;
    if (!remoteRequests || remoteRequests.length === 0) return;

    // Split requests into pending and history (using actual enum values)
    const pendingRequests = remoteRequests.filter((r: any) => 
      r.status === "pending_admin"  // Waiting for admin (Ma'am TM) to process
    );
    
    // History: Requests where ADMIN already took action (approved/rejected)
    const historyRequests = remoteRequests.filter((r: any) => {
      // Must have admin approval timestamp = admin acted on it
      const adminActed = r.admin_approved_at || r.admin_approved_by;
      
      return adminActed && (
        r.status === "pending_comptroller" ||  // Admin approved, sent to comptroller
        r.status === "pending_hr" ||           // Admin approved, sent to HR
        r.status === "pending_exec" ||         // Admin approved, sent to exec
        r.status === "approved" ||             // Fully approved
        r.status === "rejected"                // Admin rejected
      );
    });

    const pendingList = pendingRequests.map((r: any) => toRequestRowRemote(r));
    const historyList = historyRequests.map((r: any) => toRequestRowRemote(r));

    console.log("[PageInner] 📊 Pending requests for admin:", pendingList.length);
    console.log("[PageInner] 📚 History requests (admin acted):", historyList.length);

    setAllRows(pendingList);
    setFilteredRows(pendingList);
    setHistoryRows(historyList);

    const read = getReadIds();
    const unread = new Set<string>(pendingList.filter((r) => !read.has(r.id)).map((r) => r.id));
    setUnreadIds(unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRemote, remoteError, remoteRequestIds]);

  // CASE 2: remote FAILED → saka lang mag-local
  useEffect(() => {
    if (!remoteSettled) return;
    if (remoteRequests && !remoteError) return; // may remote, wag na mag-local

    const loadLocal = () => {
      console.log("📦 Loading from LocalStorage (fallback)");
      const allLocal = AdminRequestsRepo.list();
      console.log("📦 Total localStorage requests:", allLocal.length);
      
      const list = allLocal
        // TEMP: Comment out filter
        // .filter((r) => r.status !== "pending_head" && r.status !== "head_rejected")
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
    const id = setInterval(loadLocal, 5000); // Reduced frequency: every 5 seconds (was 1.5s)
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
    // Try to get from remote (Supabase) first
    const remoteReq = remoteRequests?.find((req: any) => req.id === r.id);
    
    console.log("🔍 Opening row:", r.id);
    console.log("📡 Remote data found?", !!remoteReq);
    if (remoteReq) {
      console.log("✅ Using SUPABASE data for:", remoteReq.requester?.name || remoteReq.requester?.email);
    }
    
    if (remoteReq) {
      // Transform Supabase data to match AdminRequest format expected by modal
      const transformed: any = {
        id: remoteReq.id,
        createdAt: remoteReq.created_at,
        updatedAt: remoteReq.updated_at,
        status: remoteReq.status as AdminRequest["status"],
        department: remoteReq.department?.name || remoteReq.department?.code,
        departmentCode: remoteReq.department?.code,
        requesterName: remoteReq.requester?.name || remoteReq.requester?.email,
        requesterEmail: remoteReq.requester?.email,
        requestNumber: remoteReq.request_number,
        driver: remoteReq.assigned_driver_id || '',
        vehicle: remoteReq.assigned_vehicle_id || '',
        
        // IMPORTANT: Preserve joined data from API for modal (cast to any to bypass type checking)
        requester_name: (remoteReq as any).requester_name,  // Actual requesting person
        preferred_driver: (remoteReq as any).preferred_driver,  // Joined driver data
        preferred_vehicle: (remoteReq as any).preferred_vehicle,  // Joined vehicle data
        requester: remoteReq.requester,  // Joined requester data (submitter)
        
        // Transform request data to travelOrder format
        travelOrder: {
          date: remoteReq.travel_start_date?.split('T')[0] || remoteReq.created_at?.split('T')[0] || '',
          requestingPerson: (remoteReq as any).requester_name || remoteReq.requester?.name || remoteReq.requester?.email || '',  // Use requester_name first!
          department: remoteReq.department?.name || remoteReq.department?.code || '',
          destination: remoteReq.destination || '',
          departureDate: remoteReq.travel_start_date?.split('T')[0] || '',
          returnDate: remoteReq.travel_end_date?.split('T')[0] || '',
          purposeOfTravel: remoteReq.purpose || '',
          
          // Transform expense_breakdown array to costs object format
          costs: (() => {
            const breakdown = remoteReq.expense_breakdown || [];
            const costs: any = {};
            
            // Map items to expected field names
            breakdown.forEach((item: any) => {
              const itemName = item.item?.toLowerCase() || '';
              
              if (itemName === 'food') costs.food = item.amount;
              else if (itemName === 'accommodation') costs.accommodation = item.amount;
              else if (itemName.includes('driver')) costs.driversAllowance = item.amount;
              else if (itemName.includes('rent') || itemName.includes('vehicle')) costs.rentVehicles = item.amount;
              else if (itemName === 'other' && item.description) {
                costs.otherLabel = item.description;
                costs.otherAmount = item.amount;
              } else if (itemName !== '') {
                // Store as other with item name as label
                costs.otherLabel = item.item;
                costs.otherAmount = item.amount;
              }
            });
            
            return costs;
          })(),
          
          // Signatures
          requesterSignature: remoteReq.requester_signature,
          endorsedByHeadSignature: remoteReq.head_signature,
          endorsedByHeadName: remoteReq.head_approver?.name || remoteReq.head_approver?.email || '',
          endorsedByHeadDate: remoteReq.head_approved_at ? new Date(remoteReq.head_approved_at).toLocaleDateString() : '',
        } as any,
        
        // Seminar data if exists
        seminar: remoteReq.seminar_details,
        schoolService: remoteReq.school_service_details,
        
        // Store original payload for compatibility
        payload: remoteReq as any,
        
        // Admin approval fields
        approverSignature: remoteReq.admin_signature || null,
        approvedAt: remoteReq.admin_approved_at || null,
        approvedBy: (remoteReq as any).admin_approver?.name || (remoteReq as any).admin_approver?.email || null,
        
        // Other approval fields
        comptrollerSignature: remoteReq.comptroller_signature || null,
        comptrollerAt: remoteReq.comptroller_approved_at || null,
        comptrollerBy: remoteReq.comptroller_approved_by || null,
        
        hrSignature: remoteReq.hr_signature || null,
        hrAt: remoteReq.hr_approved_at || null,
        hrBy: remoteReq.hr_approved_by || null,
        
        executiveSignature: remoteReq.executive_signature || null,
        executiveAt: remoteReq.executive_approved_at || null,
        executiveBy: remoteReq.executive_approved_by || null,
        
        tmNote: remoteReq.admin_notes || null,
        
        // Preserve approval timestamps for submission history
        head_approved_at: remoteReq.head_approved_at,
        admin_approved_at: remoteReq.admin_approved_at,
        admin_approved_by: remoteReq.admin_approved_by,
      };
      
      setActiveRow(transformed);
    } else {
      // Fallback to localStorage
      console.log("⚠️ Using LOCALSTORAGE data (Supabase data not found)");
      const full = AdminRequestsRepo.get(r.id);
      if (full) {
        console.log("📦 LocalStorage data:", full.travelOrder?.requestingPerson || full.requesterName);
        setActiveRow(full);
      } else {
        console.log("❌ No data found in localStorage either");
      }
    }
    
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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`relative px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === 'pending'
              ? 'text-[#7A0010]'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span className="flex items-center gap-2">
            Pending Requests
            {summary.pending > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-[#7A0010] rounded-full">
                {summary.pending}
              </span>
            )}
          </span>
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7A0010]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`relative px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'text-[#7A0010]'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7A0010]"></div>
          )}
        </button>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Error Message */}
          {remoteSettled && remoteError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-900 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Failed to load from Supabase. Showing local data.
            </div>
          )}

          {loadingRemote ? (
            // Skeleton Loading
            <div className="space-y-6">
              {/* Summary Cards Skeleton */}
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-20 mb-3"></div>
                    <div className="h-8 bg-neutral-200 rounded w-12 mb-2"></div>
                    <div className="h-2 bg-neutral-300 rounded-full w-full"></div>
                  </div>
                ))}
              </div>

              {/* Toolbar Skeleton */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 bg-neutral-200 rounded-lg w-64 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-neutral-200 rounded-lg w-24 animate-pulse"></div>
                    <div className="h-10 bg-neutral-200 rounded-lg w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Request Cards Skeleton */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-neutral-200 rounded-xl p-5 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-neutral-200 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-neutral-200 rounded w-32"></div>
                          <div className="h-5 bg-neutral-300 rounded w-3/4"></div>
                          <div className="h-4 bg-neutral-200 rounded w-48"></div>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="h-12 bg-neutral-100 rounded-lg"></div>
                            <div className="h-12 bg-neutral-100 rounded-lg"></div>
                            <div className="h-12 bg-neutral-100 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <RequestsSummaryUI summary={summary} />

              {/* Toolbar */}
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

              {/* Requests List */}
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
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {historyRows.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No history yet</p>
            </div>
          ) : (
            historyRows.map((item) => {
              // Get the original request to check admin action
              const originalReq = remoteRequests?.find((r: any) => r.id === item.id);
              const adminApproved = originalReq?.admin_approved_at;
              const adminRejected = (originalReq as any)?.admin_rejected_at;
              
              return (
                <div
                  key={item.id}
                  onClick={() => openRow(item)}
                  className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Admin Action Badge */}
                        {adminApproved && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approved by Admin
                          </span>
                        )}
                        {adminRejected && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rejected by Admin
                          </span>
                        )}
                        
                        {/* Current Status */}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {item.status}
                        </span>
                        
                        <span className="text-sm font-semibold text-neutral-900">{item.dept}</span>
                      </div>
                      <p className="text-sm text-neutral-700 mb-1">{item.purpose}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {item.requester}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      {adminApproved && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Admin: {new Date(adminApproved).toLocaleDateString()}
                        </span>
                      )}
                      {adminRejected && (
                        <span className="flex items-center gap-1 text-red-600">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Admin: {new Date(adminRejected).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
