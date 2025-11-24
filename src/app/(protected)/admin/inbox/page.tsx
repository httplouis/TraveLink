"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import type { RequestData } from "@/components/common/RequestDetailsView";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle, X, CheckCircle2, Loader2, Mail, Clock } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { Dialog } from "@headlessui/react";

type Request = {
  id: string;
  request_number: string;
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  requester: { id: string; name: string; email: string };
  department: { id: string; name: string; code: string };
  head_approver?: { id: string; name: string; email: string };
  admin_approver?: { id: string; name: string; email: string };
  created_at: string;
  updated_at: string;
  request_type?: string;
  seminar_data?: any;
  destination_geo?: { lat: number; lng: number };
};

export default function AdminInboxPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Request[]>([]);
  const [approvedItems, setApprovedItems] = React.useState<Request[]>([]);
  const [historyItems, setHistoryItems] = React.useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = React.useState<RequestData | null>(null);
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [viewedIds, setViewedIds] = React.useState<Set<string>>(new Set());
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [approvingRequestId, setApprovingRequestId] = React.useState<string | null>(null);

  const logger = createLogger("AdminInbox");

  // Load pending requests - Admin can see ALL pending requests
  const loadPending = React.useCallback(async () => {
    try {
      logger.info("Loading pending requests...");
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      logger.debug("Pending requests response:", { ok: result.ok, count: result.data?.length || 0 });
      
      if (result.ok && result.data) {
        // First, filter out drafts and pending_head (admin should only see head-approved requests)
        const headApprovedRequests = result.data.filter((r: any) => {
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
                console.warn(`[Admin Inbox Client] Failed to parse workflow_metadata for ${r.request_number || r.id}:`, e);
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
          
          // If head has approved, include it even if status is still pending_head
          // (this happens in multi-department requests where not all heads have approved yet)
          // OR if head explicitly sent it to admin
          // OR if head requester sent it to admin (special case)
          if (headApproved || sentToAdmin || headRequesterSentToAdmin) {
            return true;
          }
          
          // Exclude pending_head - these are still waiting for head approval
          // Only exclude if head hasn't approved yet AND hasn't sent to admin AND not head requester
          if (r.status === 'pending_head') {
            return false;
          }
          
          // Include requests that are explicitly waiting for admin
          if (r.status === 'pending_admin') {
            return true;
          }
          
          // Include all other statuses after head approval
          return true;
        });
        
        // Filter for pending: ONLY requests that are waiting for admin action
        // EXCLUDE requests where admin has already acted (admin_approved_at, admin_processed_at, admin_signature)
        const pendingRequests = headApprovedRequests.filter((r: any) => {
          // EXCLUDE if admin has already acted (signed/approved/processed)
          const adminActed = !!(r.admin_approved_at || r.admin_processed_at || r.admin_signature || r.admin_approved_by || r.admin_processed_by);
          if (adminActed) {
            return false; // Don't show in pending if admin already acted
          }
          
          // Only include requests explicitly waiting for admin
          const isPending = [
            "pending_admin"
          ].includes(r.status);
          
          // SPECIAL CASE: Include pending_head if head requester sent to admin
          // This was already included in headApprovedRequests, so keep it here
          if (r.status === 'pending_head' && r.requester_is_head) {
            const workflowMetadata = (typeof r.workflow_metadata === 'string' 
              ? JSON.parse(r.workflow_metadata) 
              : r.workflow_metadata) || {};
            if (workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id) {
              return true;
            }
          }
          
          return isPending;
        });
        
        setItems(pendingRequests || []);
        logger.success(`Loaded ${pendingRequests?.length || 0} pending requests`);
      } else {
        logger.warn("Failed to load pending requests:", result.error);
      }
    } catch (error) {
      logger.error("Error loading pending requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load approved - Requests that admin has processed and sent to next stage
  const loadApproved = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Filter for approved: requests where admin has acted AND are in intermediate states
        const approvedRequests = result.data.filter((r: any) => {
          // Admin must have acted (signed/approved/processed)
          const adminActed = !!(r.admin_approved_at || r.admin_processed_at || r.admin_signature || r.admin_approved_by || r.admin_processed_by);
          
          if (!adminActed) {
            return false; // Only show requests where admin has acted
          }
          
          // Include requests that admin processed and sent to next stage
          // (pending_comptroller, pending_hr, pending_exec, pending_vp, pending_president, pending_hr_ack)
          const isIntermediateState = [
            "pending_comptroller",
            "pending_hr",
            "pending_exec",
            "pending_vp",
            "pending_president",
            "pending_hr_ack"
          ].includes(r.status);
          
          return isIntermediateState;
        });
        
        setApprovedItems(approvedRequests || []);
      }
    } catch (error) {
      console.error("[Admin Inbox] Error loading approved:", error);
    }
  }, []);

  // Load history - Final states only
  const loadHistory = React.useCallback(async () => {
    try {
      // Use the same API endpoint to get all requests
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Filter for history: ONLY final states (approved, rejected, completed)
        const historyRequests = result.data.filter((r: any) => {
          const isFinalState = ["approved", "rejected", "completed"].includes(r.status);
          return isFinalState;
        });
        
        setHistoryItems(historyRequests || []);
      }
    } catch (error) {
      console.error("[Admin Inbox] Error loading history:", error);
    }
  }, []);

  React.useEffect(() => {
    loadPending();
    loadApproved();
    loadHistory();

    // Set up Supabase Realtime subscription for instant updates
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("admin-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          // Debounce: only trigger refetch after 500ms
          if (mutateTimeout) clearTimeout(mutateTimeout);
          mutateTimeout = setTimeout(() => {
          if (activeTab === "pending") {
            loadPending();
          } else if (activeTab === "approved") {
            loadApproved();
          } else {
            loadHistory();
          }
          }, 500);
        }
      )
      .subscribe((status: string) => {
        console.log("[Admin Inbox] Realtime subscription status:", status);
      });

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === "pending") {
        loadPending();
      } else if (activeTab === "approved") {
        loadApproved();
      } else {
        loadHistory();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, [loadPending, loadApproved, loadHistory, activeTab]);

  const markAsViewed = React.useCallback((id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_viewed_requests", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_viewed_requests");
      if (stored) {
        try {
          setViewedIds(new Set(JSON.parse(stored)));
        } catch {}
      }
    }
  }, []);

  const handleViewDetails = async (req: Request) => {
    markAsViewed(req.id);
    setLoadingDetails(true);
    setSelectedRequest(null); // Clear previous request while loading
    
    try {
      // Fetch full request details from tracking API (same as user submissions view)
      logger.info(`Fetching full details for request ${req.id}`);
      const response = await fetch(`/api/requests/${req.id}/tracking`);
      const json = await response.json();
      
      if (!json.ok || !json.data) {
        logger.warn("Failed to fetch full request details, using basic data");
        // Fallback to basic data if API fails
        const requestData: RequestData = {
          id: req.id,
          request_number: req.request_number,
          title: req.purpose || "Travel Order",
          purpose: req.purpose || "",
          destination: req.destination || "",
          department: {
            id: req.department?.id || 'dept-1',
            name: req.department?.name || req.department?.code || "Unknown",
            code: req.department?.code || 'UNK'
          },
          travel_start_date: req.travel_start_date || "",
          travel_end_date: req.travel_end_date || "",
          created_at: req.created_at,
          status: req.status,
          total_budget: 0,
          requester: {
            id: req.requester?.id || 'requester-1',
            name: req.requester?.name || "Unknown",
            email: req.requester?.email || "",
            department: req.department?.name || "Unknown",
          },
          signatures: [],
          timeline: [],
          destination_geo: req.destination_geo,
        };
        setSelectedRequest(requestData);
        return;
      }

      const fullRequestData = json.data;
      logger.debug("Full request data fetched:", {
        request_number: fullRequestData.request_number,
        has_head_endorsements: !!fullRequestData.head_endorsements,
        head_endorsements_count: fullRequestData.head_endorsements?.length || 0,
        preferred_driver_name: fullRequestData.preferred_driver_name,
        preferred_vehicle_name: fullRequestData.preferred_vehicle_name,
      });

      // Parse seminar_data if it's a string
      let seminarData = fullRequestData.seminar_data;
      if (typeof seminarData === "string") {
        try {
          seminarData = JSON.parse(seminarData);
        } catch {}
      }

      // Parse expense_breakdown if it's a string
      let expenseBreakdown = fullRequestData.expense_breakdown;
      if (typeof expenseBreakdown === "string") {
        try {
          expenseBreakdown = JSON.parse(expenseBreakdown);
        } catch {}
      }

      // Calculate total budget from expense breakdown
      let totalBudget = fullRequestData.total_budget || 0;
      if (Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
        totalBudget = expenseBreakdown.reduce((sum: number, item: any) => {
          const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      }

      // Build requesters array (main requester + additional requesters)
      const requesters: any[] = [];
      if (fullRequestData.requester) {
        requesters.push({
          id: fullRequestData.requester.id || 'main-requester',
          name: fullRequestData.requester.name || fullRequestData.requester_name || "Unknown",
          email: fullRequestData.requester.email || "",
          profile_picture: fullRequestData.requester.profile_picture,
          department: fullRequestData.requester.department || fullRequestData.department?.name,
          position: fullRequestData.requester.position || (fullRequestData.requester_is_head ? 'Department Head' : 'Faculty/Staff'),
        });
      }
      // Add additional requesters from requester_tracking
      if (fullRequestData.requester_tracking && Array.isArray(fullRequestData.requester_tracking)) {
        fullRequestData.requester_tracking.forEach((r: any) => {
          if (r.user_id && r.user_id !== fullRequestData.requester?.id) {
            requesters.push({
              id: r.user_id,
              name: r.name,
              email: r.email,
              department: r.department_name || r.department?.name,
              status: r.status,
              signature: r.signature,
            });
          }
        });
      }

      // Build signatures array for approval chain
      const requesterIsHead = fullRequestData.requester_is_head || false;
      const hasBudget = fullRequestData.has_budget || false;
      const requiresPresidentApproval = requesterIsHead || ((totalBudget || 0) > 50000);
      
      // For head requesters: use head signature as fallback (dual-signature logic)
      // If requester is head, check head signature as fallback (same signature)
      const requesterSignature = requesterIsHead
        ? (fullRequestData.requester_signature || 
           fullRequestData.head_signature || 
           fullRequestData.parent_head_signature || 
           null)
        : (fullRequestData.requester_signature || null);

      const signatures: any[] = [
        {
          id: 'requester',
          label: 'Requesting Person',
          role: 'Requester',
          status: 'approved',
          approver: {
            id: fullRequestData.requester?.id || 'current-user',
            name: fullRequestData.requester?.name || fullRequestData.requester_name || 'Unknown User',
            profile_picture: fullRequestData.requester?.profile_picture,
            department: fullRequestData.requester?.department || fullRequestData.department?.name || 'No Department',
            position: requesterIsHead ? 'Department Head' : 'Faculty/Staff'
          },
          signature: requesterSignature,
          approved_at: fullRequestData.created_at
        },
      ];
      
      // Only add head signature stage if requester is NOT a head
      if (!requesterIsHead) {
        const headApprover = fullRequestData.parent_head_approver || fullRequestData.head_approver;
        const hasHeadApproval = !!(fullRequestData.head_signature || fullRequestData.parent_head_signature || fullRequestData.head_approved_at || fullRequestData.parent_head_approved_at);
        
        signatures.push({
          id: 'head',
          label: fullRequestData.parent_head_approved_at ? 'Parent Department Head' : 'Department Head',
          role: 'Head',
          status: hasHeadApproval ? 'approved' : 'pending',
          approver: hasHeadApproval && headApprover ? {
            id: headApprover.id || 'dept-head',
            name: headApprover.name || 'Department Head',
            position: headApprover.position || headApprover.position_title || 'Department Head',
            department: headApprover.department || fullRequestData.department?.name || 'No Department',
            profile_picture: headApprover.profile_picture
          } : undefined,
          signature: fullRequestData.parent_head_signature || fullRequestData.head_signature || null,
          approved_at: fullRequestData.parent_head_approved_at || fullRequestData.head_approved_at || null
        });
      }

      // Add admin signature stage
      if (fullRequestData.admin_approved_at) {
        signatures.push({
          id: 'admin',
          label: 'Administrator',
          role: 'Admin',
          status: 'approved',
          approver: fullRequestData.admin_processed_by ? {
            id: 'admin',
            name: fullRequestData.admin_processed_by,
            position: 'Transportation Coordinator'
          } : undefined,
          signature: fullRequestData.admin_signature || null,
          approved_at: fullRequestData.admin_approved_at
        });
      } else {
        signatures.push({
          id: 'admin',
          label: 'Administrator',
          role: 'Admin',
          status: 'waiting',
        });
      }

      // Add comptroller signature stage (if has budget)
      if (hasBudget) {
        if (fullRequestData.comptroller_approved_at) {
          signatures.push({
            id: 'comptroller',
            label: 'Comptroller',
            role: 'Comptroller',
            status: 'approved',
            approver: fullRequestData.comptroller_approved_by ? {
              id: 'comptroller',
              name: fullRequestData.comptroller_approved_by,
              position: 'Comptroller'
            } : undefined,
            signature: fullRequestData.comptroller_signature || null,
            approved_at: fullRequestData.comptroller_approved_at
          });
        } else {
          signatures.push({
            id: 'comptroller',
            label: 'Comptroller',
            role: 'Comptroller',
            status: 'waiting',
          });
        }
      }

      // Add HR signature stage
      if (fullRequestData.hr_approved_at) {
        signatures.push({
          id: 'hr',
          label: 'Human Resources',
          role: 'HR',
          status: 'approved',
          approver: fullRequestData.hr_approved_by ? {
            id: 'hr',
            name: fullRequestData.hr_approved_by,
            position: 'HR Manager'
          } : undefined,
          signature: fullRequestData.hr_signature || null,
          approved_at: fullRequestData.hr_approved_at
        });
      } else {
        signatures.push({
          id: 'hr',
          label: 'Human Resources',
          role: 'HR',
          status: 'waiting',
        });
      }

      // Add VP signature stage
      if (fullRequestData.vp_approved_at) {
        signatures.push({
          id: 'vp',
          label: 'Vice President',
          role: 'VP',
          status: 'approved',
          approver: fullRequestData.vp_approved_by ? {
            id: 'vp',
            name: fullRequestData.vp_approved_by,
            position: 'Vice President'
          } : undefined,
          signature: fullRequestData.vp_signature || null,
          approved_at: fullRequestData.vp_approved_at
        });
      } else {
        signatures.push({
          id: 'vp',
          label: 'Vice President',
          role: 'VP',
          status: 'waiting',
        });
      }

      // Add President signature stage (if required)
      if (requiresPresidentApproval) {
        if (fullRequestData.president_approved_at) {
          signatures.push({
            id: 'president',
            label: 'University President',
            role: 'President',
            status: 'approved',
            approver: fullRequestData.president_approved_by ? {
              id: 'president',
              name: fullRequestData.president_approved_by,
              position: 'University President'
            } : undefined,
            signature: fullRequestData.president_signature || null,
            approved_at: fullRequestData.president_approved_at
          });
        } else {
          signatures.push({
            id: 'president',
            label: 'University President',
            role: 'President',
            status: 'waiting',
          });
        }
      }

      const requestData: RequestData = {
        id: fullRequestData.id || req.id,
        request_number: fullRequestData.request_number || req.request_number, // Travel Order code
        title: fullRequestData.title || req.purpose,
        purpose: fullRequestData.purpose || req.purpose,
        destination: fullRequestData.destination || req.destination,
        destination_geo: fullRequestData.destination_geo || req.destination_geo,
        department: fullRequestData.department ? {
          id: fullRequestData.department.id || 'dept-1',
          name: fullRequestData.department.name || fullRequestData.department_name || "Unknown",
          code: fullRequestData.department.code || fullRequestData.department_code
        } : {
          id: 'dept-1',
          name: req.department?.name || req.department?.code || "Unknown",
          code: req.department?.code || 'UNK'
        },
        travel_start_date: fullRequestData.travel_start_date || req.travel_start_date,
        travel_end_date: fullRequestData.travel_end_date || req.travel_end_date,
        created_at: fullRequestData.created_at || req.created_at,
        status: fullRequestData.status || req.status,
        total_budget: totalBudget,
        expense_breakdown: Array.isArray(expenseBreakdown) ? expenseBreakdown : [],
        transportation_type: fullRequestData.transportation_type || 'pickup',
        pickup_location: fullRequestData.pickup_location,
        pickup_time: fullRequestData.pickup_time,
        pickup_location_lat: fullRequestData.pickup_location_lat,
        pickup_location_lng: fullRequestData.pickup_location_lng,
        pickup_contact_number: fullRequestData.pickup_contact_number || fullRequestData.requester_contact_number,
        pickup_special_instructions: fullRequestData.pickup_special_instructions,
        return_transportation_same: fullRequestData.return_transportation_same,
        dropoff_location: fullRequestData.dropoff_location || fullRequestData.return_pickup_location,
        dropoff_time: fullRequestData.dropoff_time || fullRequestData.return_pickup_time,
        parking_required: fullRequestData.parking_required,
        own_vehicle_details: fullRequestData.own_vehicle_details,
        cost_justification: fullRequestData.cost_justification,
        preferred_vehicle_name: fullRequestData.preferred_vehicle_name || fullRequestData.preferred_vehicle || null,
        preferred_driver_name: fullRequestData.preferred_driver_name || fullRequestData.preferred_driver || null,
        preferred_vehicle_id: fullRequestData.preferred_vehicle_id,
        preferred_driver_id: fullRequestData.preferred_driver_id,
        preferred_vehicle_note: fullRequestData.preferred_vehicle_note,
        preferred_driver_note: fullRequestData.preferred_driver_note,
        assigned_vehicle_id: fullRequestData.assigned_vehicle_id || null,
        assigned_driver_id: fullRequestData.assigned_driver_id || null,
        assigned_vehicle: fullRequestData.assigned_vehicle ? {
          id: fullRequestData.assigned_vehicle?.id || fullRequestData.assigned_vehicle_id || '',
          name: fullRequestData.assigned_vehicle?.name || fullRequestData.assigned_vehicle?.vehicle_name || fullRequestData.assigned_vehicle_name || 'Unknown Vehicle',
          plate_number: fullRequestData.assigned_vehicle?.plate_number || fullRequestData.assigned_vehicle?.plate_no || null,
          type: fullRequestData.assigned_vehicle?.type || fullRequestData.assigned_vehicle?.vehicle_type || null,
          capacity: fullRequestData.assigned_vehicle?.capacity || null
        } : null,
        assigned_driver: fullRequestData.assigned_driver ? {
          id: fullRequestData.assigned_driver?.id || fullRequestData.assigned_driver_id || '',
          name: fullRequestData.assigned_driver?.name || fullRequestData.assigned_driver?.full_name || fullRequestData.assigned_driver_name || 'Unknown Driver',
          email: fullRequestData.assigned_driver?.email || null,
          phone: fullRequestData.assigned_driver?.phone || fullRequestData.assigned_driver?.phone_number || null,
          profile_picture: fullRequestData.assigned_driver?.profile_picture || null
        } : null,
        assigned_vehicle_name: fullRequestData.assigned_vehicle_name || fullRequestData.assigned_vehicle?.name || fullRequestData.assigned_vehicle?.vehicle_name || null,
        assigned_driver_name: fullRequestData.assigned_driver_name || fullRequestData.assigned_driver?.name || fullRequestData.assigned_driver?.full_name || null,
        driver_contact_number: fullRequestData.driver_contact_number || fullRequestData.assigned_driver?.phone || fullRequestData.assigned_driver?.phone_number || null,
        request_type: (fullRequestData.request_type === "seminar" ? "seminar" : "travel_order") as "travel_order" | "seminar" | undefined,
        seminar_data: seminarData,
        requester: {
          id: fullRequestData.requester?.id || 'current-user',
          name: fullRequestData.requester?.name || fullRequestData.requester_name || "Unknown",
          email: fullRequestData.requester?.email || req.requester?.email || "",
          profile_picture: fullRequestData.requester?.profile_picture,
          department: fullRequestData.requester?.department || fullRequestData.department?.name || "Unknown",
          position: fullRequestData.requester?.position || (fullRequestData.requester_is_head ? 'Department Head' : 'Faculty/Staff'),
          phone: fullRequestData.requester?.phone || fullRequestData.requester?.phone_number
        },
        // For head requesters: use head signature as fallback (dual-signature logic)
        requester_signature: (() => {
          const requesterIsHead = fullRequestData.requester_is_head || false;
          // If requester is head, check head signature as fallback (same signature)
          if (requesterIsHead) {
            return fullRequestData.requester_signature || 
                   fullRequestData.head_signature || 
                   fullRequestData.parent_head_signature || 
                   null;
          }
          return fullRequestData.requester_signature || null;
        })(),
        participants: fullRequestData.participants || [],
        head_endorsements: fullRequestData.head_endorsements || [], // All head endorsements
        head_approver: fullRequestData.parent_head_approver || fullRequestData.head_approver || null,
        signatures: signatures,
        timeline: fullRequestData.timeline || fullRequestData.history || [],
        attachments: fullRequestData.attachments || [],
        workflow_metadata: fullRequestData.workflow_metadata || {},
        requesterIsHead: fullRequestData.requester_is_head || false,
        hasBudget: fullRequestData.has_budget || hasBudget,
        requiresPresidentApproval: requiresPresidentApproval,
        vehicle_mode: fullRequestData.vehicle_mode || null,
      };

      logger.success("Request details loaded with full data");
      setSelectedRequest(requestData);
    } catch (error) {
      logger.error("Error fetching full request details:", error);
      // Fallback to basic data
      const requestData: RequestData = {
        id: req.id,
        request_number: req.request_number,
        title: req.purpose || "Travel Order",
        purpose: req.purpose || "",
        destination: req.destination || "",
        department: {
          id: req.department?.id || 'dept-1',
          name: req.department?.name || req.department?.code || "Unknown",
          code: req.department?.code || 'UNK'
        },
        travel_start_date: req.travel_start_date || "",
        travel_end_date: req.travel_end_date || "",
        created_at: req.created_at,
        status: req.status,
        total_budget: 0,
        requester: {
          id: req.requester?.id || 'requester-1',
          name: req.requester?.name || "Unknown",
          email: req.requester?.email || "",
          department: req.department?.name || "Unknown",
        },
        signatures: [],
        timeline: [],
        destination_geo: req.destination_geo,
      };
      setSelectedRequest(requestData);
    } finally {
      setLoadingDetails(false);
    }
  };

  const currentItems = activeTab === "pending" ? items : activeTab === "approved" ? approvedItems : historyItems;
  const uniqueDepartments = Array.from(new Set(currentItems.map((r) => r.department?.name || "Unknown")));

  // Show loading skeleton while fetching details
  if (loadingDetails) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button skeleton */}
        <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        
        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Details skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-white/30 rounded w-48 mb-2"></div>
              <div className="h-6 bg-white/20 rounded w-96 mb-4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-white/20 rounded w-32"></div>
                <div className="h-4 bg-white/20 rounded w-40"></div>
              </div>
            </div>
            
            {/* Details card skeleton */}
            <div className="bg-gray-100 rounded-xl p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          
          {/* Right column - Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <>
        <div className="p-4 md:p-6 pb-24">
          <button
            onClick={() => setSelectedRequest(null)}
            className="group mb-6 inline-flex items-center gap-2.5 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-[#7A0010]/30 hover:from-[#7A0010]/5 hover:via-[#7A0010]/10 hover:to-[#7A0010]/5 hover:text-[#7A0010] hover:shadow-md active:scale-[0.98]"
          >
            <svg 
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Inbox</span>
          </button>
          <RequestDetailsView 
            request={selectedRequest} 
            canApprove={false}
            onClose={() => {
              setSelectedRequest(null);
              loadPending();
            }}
          />
          
          {/* Floating Action Bar */}
          {(selectedRequest?.status === 'pending_admin' || selectedRequest?.status === 'pending_head') && (
            <FloatingActionBar
              onApprove={() => {
                // Open modal immediately - no delays
                console.log('[Admin Inbox] Approve button clicked, selectedRequest:', selectedRequest);
                if (selectedRequest?.id) {
                  console.log('[Admin Inbox] Setting approval modal state');
                  setApprovingRequestId(selectedRequest.id);
                  setShowApprovalModal(true);
                  console.log('[Admin Inbox] Modal state set, showApprovalModal should be true');
                } else {
                  console.warn('[Admin Inbox] No selectedRequest.id available');
                }
              }}
              requestNumber={selectedRequest?.request_number || ''}
            />
          )}
        </div>
        
        {/* Admin Approval Modal - Render here when viewing details */}
        <AdminApprovalModal
          open={showApprovalModal}
          requestId={approvingRequestId}
          request={selectedRequest}
          onClose={() => {
            console.log('[Admin Inbox] Closing approval modal');
            setShowApprovalModal(false);
            setApprovingRequestId(null);
          }}
          onApproved={() => {
            console.log('[Admin Inbox] Request approved, closing modal');
            setShowApprovalModal(false);
            setApprovingRequestId(null);
            setSelectedRequest(null);
            loadPending();
          }}
        />
      </>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transportation Coordinator Inbox</h1>
          {activeTab === "pending" && shouldShowPendingAlert(items.length) && (
            <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              getAlertSeverity(items.length) === 'danger'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : getAlertSeverity(items.length) === 'warning'
                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <span>{getAlertMessage(items.length, 'admin')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg relative ${
              activeTab === "pending"
                ? "bg-[#7a1f2a] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending ({items.length})
            {shouldShowPendingAlert(items.length) && (
              <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
                getAlertSeverity(items.length) === 'danger'
                  ? 'bg-red-500'
                  : getAlertSeverity(items.length) === 'warning'
                  ? 'bg-orange-500'
                  : 'bg-amber-500'
              } animate-pulse`} />
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "approved"
                ? "bg-[#7a1f2a] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Approved ({approvedItems.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "history"
                ? "bg-[#7a1f2a] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            History ({historyItems.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No requests found</div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((req) => {
            // Mini approval chain for Approved section
            const renderMiniChain = () => {
              if (activeTab !== "approved") return null;
              
              const r = req as any;
              const stages = [
                { key: 'admin', label: 'Admin', completed: !!(r.admin_approved_at || r.admin_processed_at || r.admin_signature) },
                { key: 'comptroller', label: 'Comptroller', completed: !!(r.comptroller_approved_at || r.comptroller_signature), current: r.status === 'pending_comptroller' },
                { key: 'hr', label: 'HR', completed: !!(r.hr_approved_at || r.hr_signature), current: r.status === 'pending_hr' || r.status === 'pending_hr_ack' },
                { key: 'vp', label: 'VP', completed: !!(r.vp_approved_at || r.vp_signature), current: r.status === 'pending_vp' },
                { key: 'president', label: 'President', completed: !!(r.president_approved_at || r.president_signature), current: r.status === 'pending_president' },
              ];
              
              // Filter to show only relevant stages (skip comptroller if no budget)
              const hasBudget = (r.total_budget || 0) > 0;
              const relevantStages = stages.filter((stage, idx) => {
                if (stage.key === 'comptroller' && !hasBudget) return false;
                // Show admin, current stage, and completed stages
                return idx === 0 || stage.completed || stage.current;
              });
              
              return (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Approval Status:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {relevantStages.map((stage, idx) => (
                      <React.Fragment key={stage.key}>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                          stage.current 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : stage.completed 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}>
                          {stage.completed ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : stage.current ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border-2 border-gray-400" />
                          )}
                          <span>{stage.label}</span>
                        </div>
                        {idx < relevantStages.length - 1 && (
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            };
            
            return (
              <div key={req.id} className={!viewedIds.has(req.id) ? "border-blue-500 bg-blue-50/30 rounded-xl" : ""}>
                <RequestCardEnhanced
                  request={{
                    id: req.id,
                    request_number: req.request_number || req.id,
                    file_code: (req as any).file_code,
                    title: (req as any).title,
                    purpose: req.purpose || "No purpose specified",
                    destination: (req as any).destination,
                    travel_start_date: req.travel_start_date,
                    travel_end_date: req.travel_end_date,
                    status: req.status,
                    created_at: req.created_at,
                    total_budget: (req as any).total_budget,
                    request_type: (req.request_type === "seminar" ? "seminar" : "travel_order") as "travel_order" | "seminar" | undefined,
                    requester_name: req.requester?.name,
                    requester: {
                      name: req.requester?.name || "Unknown",
                      email: req.requester?.email,
                      profile_picture: (req as any).requester?.profile_picture,
                      department: req.department?.name || req.department?.code,
                      position: (req as any).requester?.position_title,
                    },
                    department: req.department,
                  }}
                  showActions={true}
                  onView={() => handleViewDetails(req)}
                  className=""
                />
                {renderMiniChain()}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Approval Modal - Always render, control visibility with open prop */}
      <AdminApprovalModal
        open={showApprovalModal}
        requestId={approvingRequestId}
        request={selectedRequest}
        onClose={() => {
          console.log('[Admin Inbox] Closing approval modal');
          setShowApprovalModal(false);
          setApprovingRequestId(null);
        }}
        onApproved={() => {
          console.log('[Admin Inbox] Request approved, closing modal');
          setShowApprovalModal(false);
          setApprovingRequestId(null);
          setSelectedRequest(null);
          loadPending();
        }}
      />
    </div>
  );
}

// Admin Approval Modal Component
function AdminApprovalModal({
  open,
  requestId,
  request,
  onClose,
  onApproved,
}: {
  open: boolean;
  requestId: string | null;
  request: RequestData | null;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [signature, setSignature] = React.useState<string | null>(null);
  const [adminNotes, setAdminNotes] = React.useState("");
  const [driver, setDriver] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [sendNotifications, setSendNotifications] = React.useState(true); // Default to true
  const [drivers, setDrivers] = React.useState<Array<{id: string; name: string}>>([]);
  const [vehicles, setVehicles] = React.useState<Array<{id: string; label: string}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);
  const [requiresComptroller, setRequiresComptroller] = React.useState(false);
  const [showNextApproverModal, setShowNextApproverModal] = React.useState(false);
  const [nextApproverRole, setNextApproverRole] = React.useState<'comptroller' | 'hr' | null>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSignature(null);
      setAdminNotes("");
      setDriver("");
      setVehicle("");
      setSendNotifications(true);
      setLoadingOptions(false);
      setDrivers([]);
      setVehicles([]);
    }
  }, [open]);

  // Load drivers and vehicles - NON-BLOCKING (modal opens immediately)
  React.useEffect(() => {
    if (!open) return;
    
    let cancelled = false;
    
    // Start loading immediately (non-blocking)
    (async function loadOptions() {
      try {
        setLoadingOptions(true);
        // Use Promise.allSettled to prevent one failure from blocking the other
        const [driversResult, vehiclesResult] = await Promise.allSettled([
          fetch('/api/drivers'),
          fetch('/api/vehicles'),
        ]);
        
        if (cancelled) return;
        
        if (driversResult.status === 'fulfilled') {
          const driversData = await driversResult.value.json();
          if (driversData.ok && !cancelled) {
            setDrivers(driversData.data || []);
          }
        }
        
        if (vehiclesResult.status === 'fulfilled') {
          const vehiclesData = await vehiclesResult.value.json();
          if (vehiclesData.ok && !cancelled) {
            setVehicles(vehiclesData.data || []);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load drivers/vehicles:', error);
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Check if request requires comptroller (has budget)
  React.useEffect(() => {
    if (request) {
      const hasBudget = (request.total_budget || 0) > 0;
      setRequiresComptroller(hasBudget);
      // Set default next approver based on budget
      setNextApproverRole(hasBudget ? 'comptroller' : 'hr');
    }
  }, [request]);

  const handleApprove = async () => {
    if (!requestId || !signature || isApproving) return;
    
    if (!adminNotes.trim() || adminNotes.trim().length < 20) {
      alert("Admin notes are required and must be at least 20 characters long");
      return;
    }

    // Check if request uses owned vehicle
    const vehicleMode = (request as any)?.vehicle_mode;
    const ownVehicleDetails = (request as any)?.own_vehicle_details;
    const isOwnedVehicle = vehicleMode === 'owned' || !!ownVehicleDetails;

    setIsApproving(true);

    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          signature,
          // Only send driver/vehicle if NOT using owned vehicle
          driver: isOwnedVehicle ? null : driver,
          vehicle: isOwnedVehicle ? null : vehicle,
          adminNotes: adminNotes.trim(),
          requiresComptroller,
          nextApproverRole: nextApproverRole || (requiresComptroller ? 'comptroller' : 'hr'),
          sendNotifications, // NEW: Optional email/notification sending
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        alert(`Error: ${result.error}`);
        setIsApproving(false);
        return;
      }

      const approverName = nextApproverRole === 'comptroller' ? 'Comptroller' : 'HR';
      alert(`Request approved and sent to ${approverName}!`);
      onApproved();
    } catch (error) {
      console.error('Approval error:', error);
      alert('Network error. Please try again.');
      setIsApproving(false);
    }
  };

  // Show modal immediately - don't wait for anything
  React.useEffect(() => {
    if (open) {
      console.log('[AdminApprovalModal] Modal opened, requestId:', requestId);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, requestId]);

  if (!open) return null;
  if (!requestId) {
    console.warn('[AdminApprovalModal] No requestId provided');
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      static={false}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <Dialog.Panel className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[101]">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <Dialog.Title className="text-xl font-bold text-gray-900">
            Approve Request
          </Dialog.Title>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Request Number</p>
            <p className="text-lg font-semibold text-gray-900">{request?.request_number || 'N/A'}</p>
            {request?.purpose && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-2">Purpose</p>
                <p className="text-gray-900">{request.purpose}</p>
              </>
            )}
          </div>

          {/* Preferred Driver/Vehicle Info */}
          {(() => {
            const preferredDriver = (request as any)?.preferred_driver_name || (request as any)?.preferred_driver;
            const preferredVehicle = (request as any)?.preferred_vehicle_name || (request as any)?.preferred_vehicle;
            
            if (preferredDriver || preferredVehicle) {
              return (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Requester Preferences
                  </p>
                  <div className="space-y-2 text-sm">
                    {preferredDriver && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Preferred Driver:</span>
                        <span className="text-blue-900">{preferredDriver}</span>
                      </div>
                    )}
                    {preferredVehicle && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Preferred Vehicle:</span>
                        <span className="text-blue-900">{preferredVehicle}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Check if request uses owned vehicle */}
          {(() => {
            const vehicleMode = (request as any)?.vehicle_mode;
            const ownVehicleDetails = (request as any)?.own_vehicle_details;
            const isOwnedVehicle = vehicleMode === 'owned' || !!ownVehicleDetails;
            
            // If owned vehicle, show message instead of assignment fields
            if (isOwnedVehicle) {
              return (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-1">Personal Vehicle (Owned)</p>
                      <p className="text-xs text-green-700">
                        Requester will use their own vehicle. No university vehicle or driver assignment needed.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            
            // If not owned vehicle, show assignment fields
            return (
              <>
                {/* Driver Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Driver (Optional)
                  </label>
                  {loadingOptions ? (
                    <div className="w-full h-11 rounded-lg border-2 border-gray-300 px-4 flex items-center gap-2 bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Loading drivers...</span>
                    </div>
                  ) : (
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      className="w-full h-11 rounded-lg border-2 border-gray-300 px-4 text-sm focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                    >
                      <option value="">— Select Driver —</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Vehicle Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Vehicle (Optional)
                  </label>
                  {loadingOptions ? (
                    <div className="w-full h-11 rounded-lg border-2 border-gray-300 px-4 flex items-center gap-2 bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Loading vehicles...</span>
                    </div>
                  ) : (
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full h-11 rounded-lg border-2 border-gray-300 px-4 text-sm focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                    >
                      <option value="">— Select Vehicle —</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            );
          })()}

          {/* Admin Notes (Required) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Admin Notes <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(Minimum 20 characters)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const quickNote = "Vehicle and driver assigned as per request. All requirements met. Proceeding to next approval stage.";
                    setAdminNotes(quickNote);
                  }}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
                >
                  Quick Fill
                </button>
              </div>
            </div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
              placeholder="Add notes for comptroller/HR (e.g., vehicle ownership, special instructions...)"
              required
            />
            {adminNotes.trim().length > 0 && adminNotes.trim().length < 20 && (
              <p className="text-xs text-amber-600 mt-1">
                {20 - adminNotes.trim().length} more characters required
              </p>
            )}
          </div>

          {/* Next Approver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send to Next Approver
            </label>
            <button
              type="button"
              onClick={() => setShowNextApproverModal(true)}
              className="w-full h-11 rounded-lg border-2 border-gray-300 px-4 text-sm text-left flex items-center justify-between hover:border-[#7A0010] transition-colors bg-white"
            >
              <span className="text-gray-700">
                {nextApproverRole === 'comptroller' ? 'Comptroller' : nextApproverRole === 'hr' ? 'Human Resources' : 'Select approver...'}
              </span>
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {nextApproverRole && (
              <p className="text-xs text-gray-500 mt-1">
                Request will be sent to {nextApproverRole === 'comptroller' ? 'Comptroller' : 'HR'} for approval
              </p>
            )}
          </div>

          {/* Optional Email/Notification Sending */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="sendNotifications"
              checked={sendNotifications}
              onChange={(e) => setSendNotifications(e.target.checked)}
              className="h-4 w-4 text-[#7A0010] border-gray-300 rounded focus:ring-[#7A0010]"
            />
            <label htmlFor="sendNotifications" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Send email notifications to requester and next approver</span>
            </label>
          </div>

          {/* Digital Signature (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital Signature <span className="text-red-500">*</span>
            </label>
            <SignaturePad
              height={160}
              value={signature}
              onSave={(dataUrl) => setSignature(dataUrl)}
              onClear={() => setSignature(null)}
              showUseSavedButton={true}
              hideSaveButton
            />
            {!signature && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Signature is required to approve this request
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isApproving}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving || !signature || !adminNotes.trim() || adminNotes.trim().length < 20}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7A0010] text-white rounded-lg font-semibold hover:bg-[#5a000c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Request
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog.Panel>

      {/* Next Approver Selection Modal */}
      {showNextApproverModal && (
        <Dialog open={showNextApproverModal} onClose={() => setShowNextApproverModal(false)} className="fixed inset-0 z-[102] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[102]" onClick={() => setShowNextApproverModal(false)} />
          <Dialog.Panel className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 z-[103]">
            <div className="p-6">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                Select Next Approver
              </Dialog.Title>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setNextApproverRole('comptroller');
                    setShowNextApproverModal(false);
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    nextApproverRole === 'comptroller'
                      ? 'border-[#7A0010] bg-[#7A0010]/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Comptroller</p>
                      <p className="text-sm text-gray-500 mt-1">For requests with budget</p>
                    </div>
                    {nextApproverRole === 'comptroller' && (
                      <CheckCircle2 className="h-5 w-5 text-[#7A0010]" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNextApproverRole('hr');
                    setShowNextApproverModal(false);
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    nextApproverRole === 'hr'
                      ? 'border-[#7A0010] bg-[#7A0010]/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Human Resources</p>
                      <p className="text-sm text-gray-500 mt-1">For requests without budget</p>
                    </div>
                    {nextApproverRole === 'hr' && (
                      <CheckCircle2 className="h-5 w-5 text-[#7A0010]" />
                    )}
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNextApproverModal(false)}
                  className="px-4 py-2 bg-[#7A0010] text-white rounded-lg font-semibold hover:bg-[#5a000c] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      )}
    </Dialog>
  );
}

// Floating Action Bar Component
function FloatingActionBar({
  onApprove,
  requestNumber,
}: {
  onApprove: () => void;
  requestNumber: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#7A0010]/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-[#7A0010]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Ready to Approve</p>
              <p className="text-xs text-gray-500">{requestNumber}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onApprove();
            }}
            className="flex items-center gap-3 px-8 py-4 bg-[#7A0010] text-white rounded-xl font-bold text-base shadow-lg hover:bg-[#5a000c] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            type="button"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Approve Request</span>
          </button>
        </div>
      </div>
    </div>
  );
}
