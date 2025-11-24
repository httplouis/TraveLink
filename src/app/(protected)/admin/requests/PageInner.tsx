// src/app/(protected)/admin/requests/PageInner.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Clock, Circle } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";
import RequestsReceiverViewUI from "@/components/admin/requests/ui/RequestsReceiverView.ui";
import RequestDetailsModalUI from "@/components/admin/requests/ui/RequestDetailsModal.ui";
import KPICards from "@/components/admin/requests/ui/KPICards.ui";
import UnifiedFilterBar from "@/components/admin/requests/ui/UnifiedFilterBar.ui";

import { useDebouncedValue } from "@/lib/common/useDebouncedValue";
import type { AdminRequest } from "@/lib/admin/requests/store";
import type { RequestRow, Pagination as Pg, FilterState } from "@/lib/admin/types";
import * as TrashRepo from "@/lib/admin/requests/trashRepo";
import { DEPARTMENTS } from "@/lib/org/departments";
import { AnimatePresence, motion } from "framer-motion";
import {
  markVisitedNow,
  getReadIds,
  markRead as markReqRead,
  markManyRead,
} from "@/lib/admin/requests/notifs";

import { useRequestsFromSupabase } from "@/lib/admin/requests/useRequestsFromSupabase";
import { fetchRequest, transformToAdminRequest } from "@/lib/admin/requests/api";
import { createLogger } from "@/lib/debug";

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

function toRequestRowRemote(r: any): RequestRow | null {
  // Skip invalid requests (missing ID or critical data)
  if (!r || !r.id) {
    // Skipping invalid request (no ID) - handled by filter
    return null;
  }

  // New schema: data is directly on request object, not in payload
  // Handle missing department data gracefully
  let dept = "";
  if (r.department) {
    if (typeof r.department === 'object') {
      dept = r.department.name || r.department.code || "";
    } else if (typeof r.department === 'string') {
      dept = r.department;
    }
  }
  if (!dept && r.department_id) {
    dept = `Department ${r.department_id}`; // Fallback if department object is missing
  }

  // Handle missing requester data gracefully
  let requester = "";
  if (r.requester) {
    if (typeof r.requester === 'object') {
      requester = r.requester.name || r.requester.email || "";
    } else if (typeof r.requester === 'string') {
      requester = r.requester;
    }
  }
  if (!requester) {
    requester = r.requester_name || r.requester_email || `User ${r.requester_id || 'Unknown'}`;
  }

  // Handle missing purpose/title
  const purpose = r.purpose || r.title || r.request_number || "No purpose specified";

  const row: RequestRow = {
    id: r.id,
    dept: dept || "Unknown Department",
    purpose: purpose,
    requester: requester || "Unknown User",
    driver: r.assigned_driver_id ? `Driver ${r.assigned_driver_id}` : "—",
    vehicle: r.assigned_vehicle_id ? `Vehicle ${r.assigned_vehicle_id}` : "—",
    date: r.created_at || r.date || new Date().toISOString(),
    status: normalizeStatus(r.status as any),
  };
  
  return row;
}

const PAGE_SIZE = 12;

export default function PageInner() {
  const toast = useToast();
  const logger = createLogger("AdminRequests");

  const [mounted, setMounted] = useState(false);
  
  // Tab system for Pending, Tracking, and History
  const [activeTab, setActiveTab] = useState<'pending' | 'tracking' | 'history'>('pending');
  const [trackedRows, setTrackedRows] = useState<RequestRow[]>([]);
  const [filteredTrackedRows, setFilteredTrackedRows] = useState<RequestRow[]>([]);

  const [allRows, setAllRows] = useState<RequestRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<RequestRow[]>([]);
  const [historyRows, setHistoryRows] = useState<RequestRow[]>([]);
  const [filteredHistoryRows, setFilteredHistoryRows] = useState<RequestRow[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const [tableSearch, setTableSearch] = useState("");
  const [pendingStatusFilter, setPendingStatusFilter] = useState<string>("All");
  const [pendingDeptFilter, setPendingDeptFilter] = useState<string>("All");
  const [pendingDateFrom, setPendingDateFrom] = useState<string>("");
  const [pendingDateTo, setPendingDateTo] = useState<string>("");
  
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("All");
  const [historyDeptFilter, setHistoryDeptFilter] = useState<string>("All");
  const [historyDateFrom, setHistoryDateFrom] = useState<string>("");
  const [historyDateTo, setHistoryDateTo] = useState<string>("");
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
    
    // Process even if empty array - this allows clearing the list
    if (!remoteRequests) return;

    // ADMIN CAN ONLY SEE REQUESTS APPROVED BY HEADS - Split into pending and history
    // Exclude drafts and pending_head (not yet approved by head)
    const headApprovedRequests = remoteRequests.filter((r: any) => {
      // Exclude drafts - these are not submitted yet
      if (r.status === 'draft') {
        return false;
      }
      
      // Check if head has already approved FIRST (before excluding pending_head)
      // This handles multi-department requests where status might still be pending_head
      // but one or more heads have already approved
      const headApproved = !!(r.head_approved_at || r.head_signature || r.parent_head_approved_at || r.parent_head_signature);
      
      // Parse workflow_metadata if it's a string (JSONB from database)
      let workflowMetadata: any = {};
      if (r.workflow_metadata) {
        if (typeof r.workflow_metadata === 'string') {
          try {
            workflowMetadata = JSON.parse(r.workflow_metadata);
          } catch (e) {
            console.warn(`[PageInner] Failed to parse workflow_metadata for ${r.request_number || r.id}:`, e);
            workflowMetadata = {};
          }
        } else {
          workflowMetadata = r.workflow_metadata;
        }
      }
      
      // Also check if head sent this to admin (via workflow_metadata)
      // OR if requester is head and status is pending_head/pending_admin (head requester can send directly to admin)
      const sentToAdmin = workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id;
      const isHeadRequester = r.requester_is_head === true;
      
      // SPECIAL CASE: Head requester with next_approver_role = 'admin' should be visible to admin
      // This handles cases where head submits and selects admin during submission
      // Even if head hasn't "approved" yet (because they're the requester), they've selected admin
      const headRequesterSentToAdmin = isHeadRequester && sentToAdmin && (r.status === 'pending_head' || r.status === 'pending_admin');
      
      // Debug logging for TO-2025-155
      if (r.request_number === 'TO-2025-155') {
        console.log(`[PageInner] 🔍 DEBUG TO-2025-155:`, {
          status: r.status,
          requester_is_head: r.requester_is_head,
          headApproved,
          workflowMetadata,
          sentToAdmin,
          isHeadRequester,
          headRequesterSentToAdmin,
          shouldInclude: headApproved || sentToAdmin || headRequesterSentToAdmin
        });
      }
      
      // If head has approved, include it even if status is still pending_head
      // (this happens in multi-department requests where not all heads have approved yet)
      // OR if head explicitly sent it to admin
      // OR if head requester sent it to admin (special case)
      if (headApproved || sentToAdmin || headRequesterSentToAdmin) {
        if (r.request_number === 'TO-2025-155') {
          console.log(`[PageInner] ✅ INCLUDING TO-2025-155 in headApprovedRequests`);
        }
        return true;
      }
      
      // Exclude pending_head - these are still waiting for head approval
      // Only exclude if head hasn't approved yet AND hasn't sent to admin AND not head requester
      if (r.status === 'pending_head') {
        if (r.request_number === 'TO-2025-155') {
          console.log(`[PageInner] ❌ EXCLUDING TO-2025-155 - headApproved: ${headApproved}, sentToAdmin: ${sentToAdmin}, headRequesterSentToAdmin: ${headRequesterSentToAdmin}`);
        }
        return false;
      }
      
      // Include requests that are explicitly waiting for admin
      if (r.status === 'pending_admin') {
        return true;
      }
      
      // Include requests where head has already approved (has head_approved_at or head_signature)
      if (headApproved) {
        return true;
      }
      
      // Include all other statuses after head approval (pending_comptroller, pending_hr, etc.)
      // These are requests that have passed head approval stage
      return true;
    });
    
    // Pending: Only requests waiting for admin action (NOT yet approved by admin)
    const pendingRequests = headApprovedRequests.filter((r: any) => {
      // Check if admin has already acted on this request
      const adminActed = !!(r.admin_approved_at || r.admin_approved_by);
      
      // If admin already acted, it should be in history, not pending
      if (adminActed) {
        return false;
      }
      
      // SPECIAL CASE: Include pending_head if head requester sent to admin
      // This was already included in headApprovedRequests, so keep it here
      if (r.status === 'pending_head' && r.requester_is_head) {
        let workflowMetadata: any = {};
        if (r.workflow_metadata) {
          if (typeof r.workflow_metadata === 'string') {
            try {
              workflowMetadata = JSON.parse(r.workflow_metadata);
            } catch (e) {
              workflowMetadata = {};
            }
          } else {
            workflowMetadata = r.workflow_metadata;
          }
        }
        if (workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id) {
          if (r.request_number === 'TO-2025-155') {
            console.log(`[PageInner] ✅ Keeping TO-2025-155 in pendingRequests (head requester sent to admin)`);
          }
          return true;
        }
      }
      
      // Only show requests that are waiting for admin action
      const isWaitingForAdmin = r.status === "pending_admin";
      
      // Also include requests that are in pending state but admin hasn't acted yet
      // Exclude final states (approved, rejected, completed)
      const isNotFinalState = ![
        "approved",
        "rejected", 
        "completed"
      ].includes(r.status);
      
      return isWaitingForAdmin || (isNotFinalState && !adminActed);
    });
    
    // Tracking: All requests that have passed through admin (admin_approved_at is not null)
    // This includes requests that admin processed and sent to next stage
    const trackingRequests = headApprovedRequests.filter((r: any) => {
      // Include requests where admin already acted (admin_approved_at or admin_processed_at)
      const adminActed = !!(r.admin_approved_at || r.admin_approved_by || r.admin_processed_at || r.admin_processed_by);
      
      // Include requests that admin processed and sent to next stage
      // (pending_comptroller, pending_hr, pending_exec, pending_hr_ack)
      const adminProcessed = adminActed && [
        "pending_comptroller",
        "pending_hr",
        "pending_exec",
        "pending_hr_ack",
        "pending_vp",
        "pending_president"
      ].includes(r.status);
      
      return adminActed || adminProcessed;
    });

    // History: All requests where admin has acted OR are in final states
    // Include requests that admin approved/processed (even if still in intermediate states)
    // Also include all final states (approved, rejected, completed)
    const historyRequests = headApprovedRequests.filter((r: any) => {
      // Include requests where admin has acted (admin_approved_at or admin_processed_at)
      const adminActed = !!(r.admin_approved_at || r.admin_approved_by || r.admin_processed_at || r.admin_processed_by);
      
      // Include all final states
      const isFinalState = [
        "approved",
        "rejected", 
        "completed"
      ].includes(r.status);
      
      // Show in history if admin acted OR if it's in final state
      return adminActed || isFinalState;
    });

    const pendingList = pendingRequests
      .map((r: any) => toRequestRowRemote(r))
      .filter((row): row is RequestRow => row !== null); // Filter out null values
    const trackingList = trackingRequests
      .map((r: any) => toRequestRowRemote(r))
      .filter((row): row is RequestRow => row !== null); // Filter out null values
    const historyList = historyRequests
      .map((r: any) => toRequestRowRemote(r))
      .filter((row): row is RequestRow => row !== null); // Filter out null values

    logger.debug("Real-time update:", {
      pending: pendingList.length,
      tracking: trackingList.length,
      history: historyList.length,
      total: remoteRequests.length
    });
    
    // Debug: Log pending requests details
    if (pendingList.length > 0) {
      logger.debug("Pending requests details:", pendingList.map((r: any) => ({
        id: r.id,
        status: r.status,
        dept: r.dept,
        purpose: r.purpose,
        requester: r.requester,
        date: r.date
      })));
    }
    
    // Debug: Log the actual remote request that should be pending
    const pendingAdminRequests = remoteRequests.filter((r: any) => r.status === "pending_admin");
    if (pendingAdminRequests.length > 0) {
      logger.debug("Requests with status 'pending_admin':", pendingAdminRequests.map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        status: r.status
      })));
    }
    
    // Debug: Check what toRequestRowRemote is producing
    if (pendingRequests.length > 0) {
      const testRow = toRequestRowRemote(pendingRequests[0]);
      logger.debug("Test transformation result:", testRow);
      logger.debug("Original remote request:", pendingRequests[0]);
    }

    logger.debug("Setting allRows and filteredRows:", {
      pendingListLength: pendingList.length,
      firstRow: pendingList.length > 0 ? pendingList[0] : null,
      allRowsBefore: allRows.length,
      filteredRowsBefore: filteredRows.length
    });
    
    // Always update - this ensures the UI reflects the latest data from Supabase
    setAllRows(pendingList);
    setFilteredRows(pendingList);
    console.log("[PageInner] ✅ Updated allRows and filteredRows:", {
      allRowsAfter: pendingList.length,
      filteredRowsAfter: pendingList.length,
      previousAllRowsCount: allRows.length
    });
    
    // Sort history by most recent first
    // Priority: admin_approved_at/admin_processed_at (admin action) > updated_at > created_at
    const sortedHistory = historyList.sort((a, b) => {
      const aReq = remoteRequests.find((r: any) => r.id === a.id);
      const bReq = remoteRequests.find((r: any) => r.id === b.id);
      
      // Prioritize admin action timestamp for better sorting of recent admin approvals
      const aDate = new Date(
        aReq?.admin_approved_at || 
        aReq?.admin_processed_at || 
        aReq?.updated_at || 
        aReq?.created_at || 
        a.date
      ).getTime();
      const bDate = new Date(
        bReq?.admin_approved_at || 
        bReq?.admin_processed_at || 
        bReq?.updated_at || 
        bReq?.created_at || 
        b.date
      ).getTime();
      return bDate - aDate; // Descending (most recent first)
    });
    
    // Sort tracking by most recent first (admin_approved_at or created_at)
    const sortedTracking = trackingList.sort((a, b) => {
      const aReq = remoteRequests.find((r: any) => r.id === a.id);
      const bReq = remoteRequests.find((r: any) => r.id === b.id);
      const aDate = new Date(aReq?.admin_approved_at || aReq?.admin_processed_at || a.date).getTime();
      const bDate = new Date(bReq?.admin_approved_at || bReq?.admin_processed_at || b.date).getTime();
      return bDate - aDate; // Descending (most recent first)
    });
    
    setTrackedRows(sortedTracking);
    setFilteredTrackedRows(sortedTracking);
    
    setHistoryRows(sortedHistory);
    setFilteredHistoryRows(sortedHistory);

    const read = getReadIds();
    const unread = new Set<string>(pendingList.filter((r) => !read.has(r.id)).map((r) => r.id));
    setUnreadIds(unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRemote, remoteError, remoteRequestIds]);

  // CASE 2: remote FAILED → Show error (no localStorage fallback)
  useEffect(() => {
    if (!remoteSettled) return;
    if (remoteRequests && !remoteError) return; // may remote, ok na

    // No localStorage fallback - everything from Supabase
    if (remoteError) {
      console.error("[PageInner] Failed to load requests from Supabase:", remoteError);
      setAllRows([]);
      setFilteredRows([]);
      setTrackedRows([]);
      setFilteredTrackedRows([]);
      setHistoryRows([]);
      setFilteredHistoryRows([]);
    }
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

  // Filter pending rows based on status, department, and date range
  useEffect(() => {
    console.log("[PageInner] 🔍 Filtering rows:", {
      allRowsCount: allRows.length,
      pendingStatusFilter,
      pendingDeptFilter,
      pendingDateFrom,
      pendingDateTo,
      sampleRow: allRows.length > 0 ? allRows[0] : null
    });
    
    const filtered = allRows.filter((r) => {
      // Status filter
      const statusMatch = pendingStatusFilter === "All" || r.status === pendingStatusFilter;
      
      // Department filter
      const deptMatch = pendingDeptFilter === "All" || r.dept === pendingDeptFilter;
      
      // Date range filter
      const requestDate = new Date(r.date);
      const fromMatch = !pendingDateFrom || requestDate >= new Date(pendingDateFrom);
      const toMatch = !pendingDateTo || requestDate <= new Date(pendingDateTo + "T23:59:59");
      
      const passes = statusMatch && deptMatch && fromMatch && toMatch;
      
      if (!passes && allRows.length > 0) {
        console.log("[PageInner] 🔍 Row filtered out:", {
          id: r.id,
          statusMatch,
          deptMatch,
          fromMatch,
          toMatch,
          rowStatus: r.status,
          filterStatus: pendingStatusFilter
        });
      }
      
      return passes;
    });
    
    console.log("[PageInner] 🔍 Filter result:", {
      filteredCount: filtered.length,
      allRowsCount: allRows.length
    });
    
    setFilteredRows(filtered);
  }, [allRows, pendingStatusFilter, pendingDeptFilter, pendingDateFrom, pendingDateTo]);

  // Filter history rows based on search, status, department, and date range
  useEffect(() => {
    const searchLower = historySearch.trim().toLowerCase();
    
    const filtered = historyRows.filter((r) => {
      // Status filter
      const statusMatch = historyStatusFilter === "All" || r.status === historyStatusFilter;
      
      // Search filter
      const searchMatch = !searchLower || 
        r.requester?.toLowerCase().includes(searchLower) ||
        r.dept?.toLowerCase().includes(searchLower) ||
        r.purpose?.toLowerCase().includes(searchLower);
      
      // Department filter
      const deptMatch = historyDeptFilter === "All" || r.dept === historyDeptFilter;
      
      // Date range filter
      const requestDate = new Date(r.date);
      const fromMatch = !historyDateFrom || requestDate >= new Date(historyDateFrom);
      const toMatch = !historyDateTo || requestDate <= new Date(historyDateTo + "T23:59:59");
      
      return statusMatch && searchMatch && deptMatch && fromMatch && toMatch;
    });
    
    setFilteredHistoryRows(filtered);
  }, [historyRows, historySearch, historyStatusFilter, historyDeptFilter, historyDateFrom, historyDateTo]);

  // Filter tracked rows
  useEffect(() => {
    const searchLower = historySearch.toLowerCase();
    const filtered = trackedRows.filter((r) => {
      // Status filter
      const statusMatch = historyStatusFilter === "All" || r.status === historyStatusFilter;
      
      // Search filter
      const searchMatch = !searchLower || 
        r.requester?.toLowerCase().includes(searchLower) ||
        r.dept?.toLowerCase().includes(searchLower) ||
        r.purpose?.toLowerCase().includes(searchLower);
      
      // Department filter
      const deptMatch = historyDeptFilter === "All" || r.dept === historyDeptFilter;
      
      // Date range filter
      const requestDate = new Date(r.date);
      const fromMatch = !historyDateFrom || requestDate >= new Date(historyDateFrom);
      const toMatch = !historyDateTo || requestDate <= new Date(historyDateTo + "T23:59:59");
      
      return statusMatch && searchMatch && deptMatch && fromMatch && toMatch;
    });
    
    setFilteredTrackedRows(filtered);
  }, [trackedRows, historySearch, historyStatusFilter, historyDeptFilter, historyDateFrom, historyDateTo]);

  // ✅ ito yung kailangan ng toolbar
  const handleDraftChange = (patch: Partial<FilterState>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (next.mode === "auto") queueMicrotask(applyFilters);
      return next;
    });
  };

  // Use full department list from library instead of extracting from history
  const uniqueHistoryDepts = useMemo(() => {
    return DEPARTMENTS;
  }, []);

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

    const sorted = [...searched].sort((a, b) =>
      sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
    
    // Debug logging
    console.log("[PageInner] 🔍 postFilterRows calculation:", {
      filteredRowsCount: filteredRows.length,
      searchQuery: q,
      searchedCount: searched.length,
      sortedCount: sorted.length,
      sampleRow: sorted.length > 0 ? sorted[0] : null
    });
    
    return sorted;
  }, [filteredRows, debouncedQ, sortDir]);

  useEffect(() => {
    setPagination((p) => {
      const total = postFilterRows.length;
      const maxPage = Math.max(1, Math.ceil(total / p.pageSize) || 1);
      const newPage = Math.min(p.page, maxPage);
      console.log("[PageInner] 📄 Updating pagination:", {
        total,
        maxPage,
        currentPage: p.page,
        newPage,
        pageSize: p.pageSize
      });
      return { ...p, total, page: newPage };
    });
  }, [postFilterRows]);

  const pageRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const sliced = postFilterRows.slice(start, start + pagination.pageSize);
    
    // Debug logging
    console.log("[PageInner] 📄 pageRows calculation:", {
      postFilterRowsCount: postFilterRows.length,
      paginationPage: pagination.page,
      pageSize: pagination.pageSize,
      start,
      end: start + pagination.pageSize,
      slicedCount: sliced.length,
      sampleRow: sliced.length > 0 ? {
        id: sliced[0].id,
        dept: sliced[0].dept,
        purpose: sliced[0].purpose,
        status: sliced[0].status,
        requester: sliced[0].requester
      } : null,
      allPostFilterRows: postFilterRows.map(r => ({
        id: r.id,
        dept: r.dept,
        purpose: r.purpose,
        status: r.status
      }))
    });
    
    return sliced;
  }, [postFilterRows, pagination.page, pagination.pageSize]);

  const markOneRead = (id: string) => {
    markReqRead(id);
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Helper function to transform tracking API data to AdminRequest format
  const transformTrackingDataToAdminRequest = (fullRequestData: any): any => {
    // Parse expense_breakdown if it's a string
    let expenseBreakdown = fullRequestData.expense_breakdown;
    if (typeof expenseBreakdown === "string") {
      try {
        expenseBreakdown = JSON.parse(expenseBreakdown);
      } catch {}
    }

    // Calculate total budget
    let totalBudget = fullRequestData.total_budget || 0;
    if (Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
      totalBudget = expenseBreakdown.reduce((sum: number, item: any) => {
        const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    }

    return {
      id: fullRequestData.id,
      createdAt: fullRequestData.created_at,
      updatedAt: fullRequestData.updated_at,
      status: fullRequestData.status as AdminRequest["status"],
      department: fullRequestData.department?.name || fullRequestData.department?.code || "Unknown",
      departmentCode: fullRequestData.department?.code,
      requesterName: fullRequestData.requester?.name || fullRequestData.requester_name || "Unknown",
      requesterEmail: fullRequestData.requester?.email || "",
      requestNumber: fullRequestData.request_number, // Travel Order code
      driver: fullRequestData.assigned_driver?.name || fullRequestData.assigned_driver_id || '',
      vehicle: fullRequestData.assigned_vehicle ? 
        `${fullRequestData.assigned_vehicle.model || fullRequestData.assigned_vehicle.vehicle_name || 'Vehicle'} (${fullRequestData.assigned_vehicle.plate_number})` : 
        (fullRequestData.assigned_vehicle_id || ''),
      
      // IMPORTANT: Include all data from tracking API
      requester_name: fullRequestData.requester?.name || fullRequestData.requester_name,
      preferred_driver: fullRequestData.preferred_driver_name || fullRequestData.preferred_driver || null,
      preferred_vehicle: fullRequestData.preferred_vehicle_name || fullRequestData.preferred_vehicle || null,
      preferred_driver_id: fullRequestData.preferred_driver_id,
      preferred_vehicle_id: fullRequestData.preferred_vehicle_id,
      requester: fullRequestData.requester,
      vehicle_mode: fullRequestData.transportation_type === 'pickup' ? 'institutional' : 
                    fullRequestData.transportation_type === 'self' ? 'owned' : 'rent',
      
      // Transform request data to travelOrder format
      travelOrder: {
        date: fullRequestData.travel_start_date?.split('T')[0] || fullRequestData.created_at?.split('T')[0] || '',
        requestingPerson: fullRequestData.requester?.name || fullRequestData.requester_name || '',
        department: fullRequestData.department?.name || fullRequestData.department?.code || '',
        destination: fullRequestData.destination || '',
        departureDate: fullRequestData.travel_start_date?.split('T')[0] || '',
        returnDate: fullRequestData.travel_end_date?.split('T')[0] || '',
        purposeOfTravel: fullRequestData.purpose || '',
        
        // Transform expense_breakdown array to costs object format
        costs: (() => {
          const breakdown = expenseBreakdown || [];
          const costs: any = {};
          
          breakdown.forEach((item: any) => {
            const itemName = (item.item || item.category || '').toLowerCase();
            
            if (itemName === 'food') {
              costs.food = item.amount;
              if (item.description) costs.foodDescription = item.description;
            } else if (itemName === 'accommodation') {
              costs.accommodation = item.amount;
              if (item.description) costs.accommodationDescription = item.description;
            } else if (itemName.includes('driver') && itemName.includes('allowance')) {
              costs.driversAllowance = item.amount;
              if (item.description) costs.driversAllowanceDescription = item.description;
            } else if (itemName.includes('hired') && itemName.includes('driver')) {
              costs.hiredDrivers = item.amount;
              if (item.description) costs.hiredDriversDescription = item.description;
            } else if (itemName.includes('rent') || itemName.includes('vehicle') || itemName.includes('transport')) {
              costs.rentVehicles = item.amount;
              if (item.description) costs.rentVehiclesDescription = item.description;
            } else if (itemName === 'other' && item.description) {
              costs.otherLabel = item.description;
              costs.otherAmount = item.amount;
            } else if (itemName !== '') {
              if (!costs.otherItems) costs.otherItems = [];
              costs.otherItems.push({
                label: item.item || item.category,
                amount: item.amount,
                description: item.description
              });
            }
          });
          
          return costs;
        })(),
        
        // Signatures
        requesterSignature: fullRequestData.requester_signature,
        endorsedByHeadSignature: fullRequestData.head_signature || fullRequestData.parent_head_signature,
        endorsedByHeadName: fullRequestData.head_approver?.name || fullRequestData.parent_head_approver?.name || '',
        endorsedByHeadDate: fullRequestData.head_approved_at || fullRequestData.parent_head_approved_at ? 
          new Date(fullRequestData.head_approved_at || fullRequestData.parent_head_approved_at).toLocaleDateString() : '',
      } as any,
      
      // Seminar data if exists
      seminar: fullRequestData.seminar_data || fullRequestData.seminar_details,
      schoolService: fullRequestData.school_service_details,
      
      // Store original payload for compatibility
      payload: fullRequestData as any,
      
      // Admin approval fields
      approverSignature: fullRequestData.admin_signature || null,
      approvedAt: fullRequestData.admin_approved_at || null,
      approvedBy: fullRequestData.admin_processed_by || null,
      
      // Other approval fields
      comptrollerSignature: fullRequestData.comptroller_signature || null,
      comptrollerAt: fullRequestData.comptroller_approved_at || null,
      comptrollerBy: fullRequestData.comptroller_approved_by || null,
      
      hrSignature: fullRequestData.hr_signature || null,
      hrAt: fullRequestData.hr_approved_at || null,
      hrBy: fullRequestData.hr_approved_by || null,
      
      // VP approval fields
      vp_approved_at: fullRequestData.vp_approved_at || null,
      vp_approved_by: fullRequestData.vp_approved_by || null,
      vp_signature: fullRequestData.vp_signature || null,
      vp_approver: fullRequestData.vp_approver || null,
      
      // Parent head approval fields
      parent_head_approved_at: fullRequestData.parent_head_approved_at || null,
      parent_head_approved_by: fullRequestData.parent_head_approved_by || null,
      parent_head_signature: fullRequestData.parent_head_signature || null,
      parent_head_approver: fullRequestData.parent_head_approver || null,
      
      // Head approval fields
      head_approved_at: fullRequestData.head_approved_at || null,
      head_approved_by: fullRequestData.head_approved_by || null,
      head_signature: fullRequestData.head_signature || null,
      head_approver: fullRequestData.head_approver || null,
      
      executiveSignature: fullRequestData.executive_signature || null,
      executiveAt: fullRequestData.executive_approved_at || null,
      executiveBy: fullRequestData.executive_approved_by || null,
      
      tmNote: fullRequestData.admin_notes || null,
      
      // Preserve approval timestamps and signatures
      admin_approved_at: fullRequestData.admin_approved_at,
      admin_approved_by: fullRequestData.admin_approved_by,
      admin_signature: fullRequestData.admin_signature,
      admin_approver: fullRequestData.admin_processed_by || null,
      
      // Head endorsement invitations (for multi-department requests) - CRITICAL!
      head_endorsements: fullRequestData.head_endorsements || [],
      
      // Additional requesters
      additional_requesters: fullRequestData.requester_tracking || [],
      
      // Participants
      participants: fullRequestData.participants || [],
    };
  };

  const openRow = async (r: RequestRow) => {
    // Fetch full request details from tracking API (same as inbox page)
    console.log("🔍 Opening row:", r.id);
    
    try {
      logger.info(`Fetching full details for request ${r.id} from tracking API`);
      const response = await fetch(`/api/requests/${r.id}/tracking`);
      const json = await response.json();
      
      if (!json.ok || !json.data) {
        logger.warn("Failed to fetch full request details from tracking API, falling back to remote data");
        // Fallback to remote data
        const remoteReq = remoteRequests?.find((req: any) => req.id === r.id);
        if (remoteReq) {
          // Use existing transformation logic
          const transformed = transformRemoteRequest(remoteReq);
          setActiveRow(transformed);
          markOneRead(r.id);
          setOpenDetails(true);
          return;
        } else {
          // Final fallback to fetchRequest
          try {
            const fullRequest = await fetchRequest(r.id);
            if (fullRequest) {
              const full = transformToAdminRequest(fullRequest);
              setActiveRow(full);
              markOneRead(r.id);
              setOpenDetails(true);
            } else {
              toast({ message: "Request not found", kind: "error" });
            }
          } catch (err: any) {
            console.error("❌ Error fetching request:", err);
            toast({ message: `Error loading request: ${err.message}`, kind: "error" });
          }
          return;
        }
      }

      const fullRequestData = json.data;
      logger.debug("Full request data fetched from tracking API:", {
        request_number: fullRequestData.request_number,
        has_head_endorsements: !!fullRequestData.head_endorsements,
        head_endorsements_count: fullRequestData.head_endorsements?.length || 0,
        preferred_driver_name: fullRequestData.preferred_driver_name,
        preferred_vehicle_name: fullRequestData.preferred_vehicle_name,
      });

      // Transform tracking API data to AdminRequest format
      const transformed = transformTrackingDataToAdminRequest(fullRequestData);
      setActiveRow(transformed);
      markOneRead(r.id);
      setOpenDetails(true);
    } catch (error: any) {
      logger.error("Error fetching full request details:", error);
      // Fallback to remote data
      const remoteReq = remoteRequests?.find((req: any) => req.id === r.id);
      if (remoteReq) {
        const transformed = transformRemoteRequest(remoteReq);
        setActiveRow(transformed);
        markOneRead(r.id);
        setOpenDetails(true);
      } else {
        toast({ message: `Error loading request: ${error.message}`, kind: "error" });
      }
    }
  };

  // Helper function to transform remote request data
  const transformRemoteRequest = (remoteReq: any): any => {
    console.log("✅ Using SUPABASE data for:", remoteReq.requester?.name || remoteReq.requester?.email);
    console.log("🔍 VP Approval Data:", {
      vp_approved_at: (remoteReq as any).vp_approved_at,
      vp_approved_by: (remoteReq as any).vp_approved_by,
      vp_signature: (remoteReq as any).vp_signature ? "EXISTS" : "NULL",
      vp_approver: (remoteReq as any).vp_approver,
      vp_approver_is_head: (remoteReq as any).vp_approver?.is_head
    });
    
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
        vehicle_mode: (remoteReq as any).vehicle_mode,  // Transportation mode (owned/institutional/rent)
        
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
            
            // Map items to expected field names and descriptions
            breakdown.forEach((item: any) => {
              const itemName = item.item?.toLowerCase() || '';
              
              if (itemName === 'food') {
                costs.food = item.amount;
                if (item.description) costs.foodDescription = item.description;
              } else if (itemName === 'accommodation') {
                costs.accommodation = item.amount;
                if (item.description) costs.accommodationDescription = item.description;
              } else if (itemName.includes('driver') && itemName.includes('allowance')) {
                costs.driversAllowance = item.amount;
                if (item.description) costs.driversAllowanceDescription = item.description;
              } else if (itemName.includes('hired') && itemName.includes('driver')) {
                costs.hiredDrivers = item.amount;
                if (item.description) costs.hiredDriversDescription = item.description;
              } else if (itemName.includes('rent') || itemName.includes('vehicle') || itemName.includes('transport')) {
                costs.rentVehicles = item.amount;
                if (item.description) costs.rentVehiclesDescription = item.description;
              } else if (itemName === 'other' && item.description) {
                costs.otherLabel = item.description;
                costs.otherAmount = item.amount;
              } else if (itemName !== '') {
                // Store as other with item name as label
                if (!costs.otherItems) costs.otherItems = [];
                costs.otherItems.push({
                  label: item.item,
                  amount: item.amount,
                  description: item.description
                });
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
        
        // VP approval fields (important for head endorsement if VP is also head)
        vp_approved_at: (remoteReq as any).vp_approved_at || null,
        vp_approved_by: (remoteReq as any).vp_approved_by || null,
        vp_signature: (remoteReq as any).vp_signature || null,
        vp_approver: (remoteReq as any).vp_approver || null,
        
        // Parent head approval fields
        parent_head_approved_at: (remoteReq as any).parent_head_approved_at || null,
        parent_head_approved_by: (remoteReq as any).parent_head_approved_by || null,
        parent_head_signature: (remoteReq as any).parent_head_signature || null,
        parent_head_approver: (remoteReq as any).parent_head_approver || null,
        
        // Head approval fields (for direct head)
        head_approved_at: remoteReq.head_approved_at || null,
        head_approved_by: remoteReq.head_approved_by || null,
        head_signature: remoteReq.head_signature || null,
        head_approver: (remoteReq as any).head_approver || null,
        
        executiveSignature: remoteReq.executive_signature || null,
        executiveAt: remoteReq.executive_approved_at || null,
        executiveBy: remoteReq.executive_approved_by || null,
        
        tmNote: remoteReq.admin_notes || null,
        
        // Preserve approval timestamps and signatures for submission history
        admin_approved_at: remoteReq.admin_approved_at,
        admin_approved_by: remoteReq.admin_approved_by,
        admin_signature: remoteReq.admin_signature,
        admin_approver: (remoteReq as any).admin_approver || null,
        
        // Head endorsement invitations (for multi-department requests)
        head_endorsements: (remoteReq as any).head_endorsements || null,
      };
      
      return transformed;
    }
    return null;
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

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    // Fetch items from API instead of localStorage
    const requestPromises = ids.map(async (id) => {
      const request = await fetchRequest(id);
      return request ? transformToAdminRequest(request) : null;
    });
    const items = (await Promise.all(requestPromises)).filter((r): r is AdminRequest => r !== null);

    if (items.length) {
      TrashRepo.addMany(
        items.map((it) => ({ ...it, deletedAt: new Date().toISOString() })),
      );
    }

    // Note: Deletion is now handled by API - requests are soft-deleted or archived
    // The list will update automatically via useRequestsFromSupabase hook
    
    // Update local state to remove deleted items
    setAllRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setFilteredRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setTrackedRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setFilteredTrackedRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setHistoryRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setFilteredHistoryRows((prev) => prev.filter((r) => !ids.includes(r.id)));
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

  // History KPI stats
  const historySummary = useMemo(
    () => ({
      pending: filteredHistoryRows.filter((r) => r.status === "Pending").length,
      approved: filteredHistoryRows.filter((r) => r.status === "Approved").length,
      completed: filteredHistoryRows.filter((r) => r.status === "Completed").length,
      rejected: filteredHistoryRows.filter((r) => r.status === "Rejected").length,
    }),
    [filteredHistoryRows],
  );

  if (!mounted) return <div />;

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation with spacing and sliding indicator - 3 Tabs */}
      <div className="mx-6 relative rounded-full p-1.5 flex gap-1 shadow-md" style={{ backgroundColor: '#7A0010' }}>
        {/* Sliding background indicator */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-lg"
          initial={false}
          animate={{
            left: activeTab === 'pending' ? '6px' : activeTab === 'tracking' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 2px)',
            width: 'calc(33.333% - 8px)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`relative z-10 flex-1 px-4 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
            activeTab === 'pending'
              ? 'text-[#7A0010]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Pending</span>
            {allRows.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'pending' ? 'bg-[#7A0010] text-white' : 'bg-white/20 text-white'
              }`}>
                {allRows.length}
              </span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('tracking')}
          className={`relative z-10 flex-1 px-4 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
            activeTab === 'tracking'
              ? 'text-[#7A0010]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Tracking</span>
            {trackedRows.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'tracking' ? 'bg-[#7A0010] text-white' : 'bg-white/20 text-white'
              }`}>
                {trackedRows.length}
              </span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          className={`relative z-10 flex-1 px-4 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
            activeTab === 'history'
              ? 'text-[#7A0010]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">History</span>
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'pending' ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mx-6 space-y-6"
          >
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
              {/* KPI Cards */}
              <KPICards summary={summary} />

              {/* Unified Filter Bar */}
              <UnifiedFilterBar
                searchValue={tableSearch}
                onSearchChange={setTableSearch}
                searchPlaceholder="Search by requester, department, or purpose..."
                statusValue={pendingStatusFilter}
                onStatusChange={setPendingStatusFilter}
                deptValue={pendingDeptFilter}
                onDeptChange={setPendingDeptFilter}
                departments={DEPARTMENTS}
                dateFrom={pendingDateFrom}
                onDateFromChange={setPendingDateFrom}
                dateTo={pendingDateTo}
                onDateToChange={setPendingDateTo}
                onClear={() => {
                  setPendingStatusFilter("All");
                  setPendingDeptFilter("All");
                  setPendingDateFrom("");
                  setPendingDateTo("");
                }}
                hasActiveFilters={
                  pendingStatusFilter !== "All" ||
                  pendingDeptFilter !== "All" ||
                  !!pendingDateFrom ||
                  !!pendingDateTo
                }
                resultsCount={postFilterRows.length}
                totalCount={filteredRows.length}
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
          </motion.div>
        ) : activeTab === 'tracking' ? (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mx-6 space-y-6"
          >
          {/* Tracking KPI Cards */}
          <KPICards
            summary={{
              pending: filteredTrackedRows.filter((r) => r.status === "Pending").length,
              approved: filteredTrackedRows.filter((r) => r.status === "Approved").length,
              completed: filteredTrackedRows.filter((r) => r.status === "Completed").length,
              rejected: filteredTrackedRows.filter((r) => r.status === "Rejected").length,
            }}
          />

          {/* Tracking Unified Filter Bar */}
          <UnifiedFilterBar
            search={historySearch}
            onSearchChange={setHistorySearch}
            status={historyStatusFilter}
            onStatusChange={setHistoryStatusFilter}
            dept={historyDeptFilter}
            onDeptChange={setHistoryDeptFilter}
            departments={uniqueHistoryDepts}
            dateFrom={historyDateFrom}
            onDateFromChange={setHistoryDateFrom}
            dateTo={historyDateTo}
            onDateToChange={setHistoryDateTo}
            onClear={() => {
              setHistorySearch("");
              setHistoryStatusFilter("All");
              setHistoryDeptFilter("All");
              setHistoryDateFrom("");
              setHistoryDateTo("");
            }}
            hasActiveFilters={
              historySearch !== "" ||
              historyStatusFilter !== "All" ||
              historyDeptFilter !== "All" ||
              historyDateFrom !== "" ||
              historyDateTo !== ""
            }
            resultsCount={filteredTrackedRows.length}
            totalCount={trackedRows.length}
          />
          
          {filteredTrackedRows.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium text-neutral-600 mb-2">No Tracked Requests</p>
              <p className="text-sm text-neutral-500">Requests that pass through admin will appear here.</p>
            </div>
          ) : (
            filteredTrackedRows.map((item) => {
              // Get the original request to check admin action and workflow status
              const originalReq = remoteRequests?.find((r: any) => r.id === item.id);
              const adminApproved = originalReq?.admin_approved_at || originalReq?.admin_processed_at;
              const adminRejected = (originalReq as any)?.admin_rejected_at;
              
              // Get all approval timestamps and approver info
              const headApproved = originalReq?.head_approved_at;
              const headApprover = originalReq?.head_approver || originalReq?.parent_head_approver;
              const headSignature = originalReq?.head_signature || originalReq?.parent_head_signature;
              
              const comptrollerApproved = originalReq?.comptroller_approved_at;
              const comptrollerApprover = originalReq?.comptroller_approver;
              const comptrollerSignature = originalReq?.comptroller_signature;
              
              const hrApproved = originalReq?.hr_approved_at;
              const hrApprover = originalReq?.hr_approver;
              const hrSignature = originalReq?.hr_signature;
              
              const vpApproved = originalReq?.vp_approved_at || originalReq?.exec_approved_at;
              const vpApprover = originalReq?.vp_approver || originalReq?.exec_approver;
              const vpSignature = originalReq?.vp_signature || originalReq?.exec_signature;
              
              const presidentApproved = originalReq?.president_approved_at;
              const presidentApprover = originalReq?.president_approver;
              const presidentSignature = originalReq?.president_signature;
              
              const adminApprover = originalReq?.admin_approver;
              const adminSignature = originalReq?.admin_signature;
              
              // Check if requester is a head (important for skipping Head stage)
              const requesterIsHead = originalReq?.requester_is_head === true;
              
              // Determine current workflow stage
              const currentStatus = originalReq?.status || item.status;
              
              // Define workflow stages with approval history data
              // IMPORTANT: Skip Head stage if requester is a head (they don't approve their own requests)
              const stages = [
                { 
                  key: 'head', 
                  label: 'Head', 
                  approved: !!headApproved, 
                  current: currentStatus?.includes('head') && !headApproved, 
                  show: !requesterIsHead,
                  approver: headApprover,
                  signature: headSignature,
                  approvedAt: headApproved || originalReq?.parent_head_approved_at
                },
                { 
                  key: 'admin', 
                  label: 'Admin', 
                  approved: !!adminApproved, 
                  current: currentStatus === 'pending_admin' && !adminApproved,
                  approver: adminApprover,
                  signature: adminSignature,
                  approvedAt: adminApproved
                },
                { 
                  key: 'comptroller', 
                  label: 'Comptroller', 
                  approved: !!comptrollerApproved, 
                  current: currentStatus?.includes('comptroller') && !comptrollerApproved, 
                  show: originalReq?.has_budget,
                  approver: comptrollerApprover,
                  signature: comptrollerSignature,
                  approvedAt: comptrollerApproved
                },
                { 
                  key: 'hr', 
                  label: 'HR', 
                  approved: !!hrApproved, 
                  current: currentStatus?.includes('hr') && !hrApproved,
                  approver: hrApprover,
                  signature: hrSignature,
                  approvedAt: hrApproved
                },
                { 
                  key: 'vp', 
                  label: 'VP', 
                  approved: !!vpApproved, 
                  current: (currentStatus?.includes('vp') || currentStatus?.includes('exec')) && !vpApproved,
                  approver: vpApprover,
                  signature: vpSignature,
                  approvedAt: vpApproved
                },
                { 
                  key: 'president', 
                  label: 'President', 
                  approved: !!presidentApproved, 
                  current: currentStatus?.includes('president') && !presidentApproved,
                  approver: presidentApprover,
                  signature: presidentSignature,
                  approvedAt: presidentApproved
                },
                { 
                  key: 'approved', 
                  label: 'Approved', 
                  approved: currentStatus === 'approved' || currentStatus === 'completed', 
                  current: false,
                  approvedAt: originalReq?.final_approved_at || originalReq?.updated_at
                },
              ].filter(s => s.show !== false); // Filter out stages that don't apply

              return (
                <div
                  key={item.id}
                  onClick={async () => {
                    // When clicking tracking card, switch to history tab and open request details
                    setActiveTab('history');
                    try {
                      const response = await fetch(`/api/requests/${item.id}/tracking`);
                      const json = await response.json();
                      if (json.ok && json.data) {
                        const transformed = transformTrackingDataToAdminRequest(json.data);
                        setActiveRow(transformed);
                        setOpenDetails(true);
                        markReqRead(item.id);
                        setUnreadIds((prev) => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      } else {
                        const req = await fetchRequest(item.id);
                        if (req) {
                          const full = transformToAdminRequest(req);
                          setActiveRow(full);
                          setOpenDetails(true);
                          markReqRead(item.id);
                          setUnreadIds((prev) => {
                            const next = new Set(prev);
                            next.delete(item.id);
                            return next;
                          });
                        }
                      }
                    } catch (err) {
                      console.error("Error loading request:", err);
                    }
                  }}
                  className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:border-[#7A0010] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Request Info */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-neutral-900 truncate">{item.dept}</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-700 mb-2 line-clamp-2">{item.purpose}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
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
                        </div>
                      </div>
                      
                      {/* Workflow Chain - Circular nodes with lines (clickable for history) */}
                      <div className="flex items-center gap-1 py-2 overflow-x-auto">
                        {stages.map((stage, index) => {
                          const isCompleted = stage.approved;
                          const isCurrent = stage.current;
                          const isPending = !isCompleted && !isCurrent;
                          const isLast = index === stages.length - 1;
                          const hasHistory = isCompleted && (stage.approver || stage.signature || stage.approvedAt);
                          
                          // Determine node style
                          let nodeClass = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ';
                          let lineClass = 'h-0.5 flex-1 min-w-[24px] transition-all ';
                          
                          if (isCompleted) {
                            nodeClass += 'bg-green-500 border-green-600 text-white shadow-md';
                            lineClass += 'bg-green-500';
                          } else if (isCurrent) {
                            nodeClass += 'bg-blue-500 border-blue-600 text-white shadow-md animate-pulse';
                            lineClass += 'bg-gray-300';
                          } else {
                            nodeClass += 'bg-gray-200 border-gray-300 text-gray-500';
                            lineClass += 'bg-gray-200';
                          }
                          
                          // Add hover effect if has history
                          if (hasHistory) {
                            nodeClass += ' cursor-pointer hover:scale-110 hover:shadow-lg';
                          }
                          
                          return (
                            <React.Fragment key={stage.key}>
                              <div className="flex flex-col items-center relative group">
                                <div 
                                  className={nodeClass}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    // When clicking workflow chain, switch to history tab (don't open modal)
                                    setActiveTab('history');
                                    // Mark as read
                                    markReqRead(item.id);
                                    setUnreadIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(item.id);
                                      return next;
                                    });
                                  }}
                                  title={`Click to view ${item.purpose || 'request'} in history`}
                                >
                                  {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                  ) : isCurrent ? (
                                    <Clock className="w-4 h-4" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                
                                {/* Tooltip on hover for completed stages */}
                                {hasHistory && (
                                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                    <div className="font-semibold mb-1">{stage.label} Approval</div>
                                    {stage.approver?.name && (
                                      <div className="text-gray-300">By: {stage.approver.name}</div>
                                    )}
                                    {stage.approvedAt && (
                                      <div className="text-gray-300">
                                        {new Date(stage.approvedAt).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric',
                                          timeZone: 'Asia/Manila'
                                        })}
                                      </div>
                                    )}
                                    {stage.signature && (
                                      <div className="text-green-400 mt-1">✓ Signed</div>
                                    )}
                                  </div>
                                )}
                                
                                <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                                  isCompleted ? 'text-green-600' : 
                                  isCurrent ? 'text-blue-600' : 
                                  'text-gray-400'
                                }`}>
                                  {stage.label}
                                </span>
                              </div>
                              {!isLast && <div className={lineClass} />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mx-6 space-y-6"
          >
          {/* History KPI Cards */}
          <KPICards summary={historySummary} />

          {/* History Unified Filter Bar */}
          <UnifiedFilterBar
            searchValue={historySearch}
            onSearchChange={setHistorySearch}
            searchPlaceholder="Search history by requester, department, or purpose..."
            statusValue={historyStatusFilter}
            onStatusChange={setHistoryStatusFilter}
            deptValue={historyDeptFilter}
            onDeptChange={setHistoryDeptFilter}
            departments={uniqueHistoryDepts}
            dateFrom={historyDateFrom}
            onDateFromChange={setHistoryDateFrom}
            dateTo={historyDateTo}
            onDateToChange={setHistoryDateTo}
            onClear={() => {
              setHistorySearch("");
              setHistoryStatusFilter("All");
              setHistoryDeptFilter("All");
              setHistoryDateFrom("");
              setHistoryDateTo("");
            }}
            hasActiveFilters={
              !!historySearch ||
              historyStatusFilter !== "All" ||
              historyDeptFilter !== "All" ||
              !!historyDateFrom ||
              !!historyDateTo
            }
            resultsCount={filteredHistoryRows.length}
            totalCount={historyRows.length}
          />
          
          {filteredHistoryRows.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{(historySearch || historyStatusFilter !== "All" || historyDeptFilter !== "All" || historyDateFrom || historyDateTo) ? "No matching history found" : "No history yet"}</p>
            </div>
          ) : (
            filteredHistoryRows.map((item) => {
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
          </motion.div>
        )}
      </AnimatePresence>

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
