"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import RequestCard from "@/components/common/RequestCardWow";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import Modal from "@/components/common/Modal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import PaymentConfirmationButton from "./PaymentConfirmationButton";
import { createLogger } from "@/lib/debug";

type Request = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  created_at: string;
  has_budget: boolean;
  total_budget: number;
  requester_name?: string; // Add requester name from API
  requester_is_head?: boolean; // Whether requester is department head
  has_parent_head?: boolean; // Whether department has parent head
  request_type?: 'seminar' | 'travel_order'; // Request type
  seminar_data?: any; // Seminar data (JSONB field)
  department: {
    code: string;
    name: string;
  } | null;
};

type HistoryItem = {
  id: string;
  action: string;
  actor: {
    name: string;
    email: string;
  };
  previous_status: string;
  new_status: string;
  comments: string;
  created_at: string;
};

export default function SubmissionsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [fullRequestData, setFullRequestData] = React.useState<any>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  React.useEffect(() => {
    fetchSubmissions();
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchSubmissions, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSubmissions() {
    const logger = createLogger("SubmissionsView");
    try {
      logger.debug("Fetching submissions from /api/requests/my-submissions...");
      const res = await fetch("/api/requests/my-submissions");
      
      logger.debug(`Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        // Try to get error details from response
        let errorText = '';
        try {
          errorText = await res.text();
          // Try to parse as JSON first
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              throw new Error(errorJson.error);
            }
          } catch {
            // Not JSON, might be HTML (Cloudflare error page)
            if (errorText.includes('<!DOCTYPE html>') || errorText.includes('Internal server error')) {
              throw new Error(`Server error (${res.status}). Please try again in a moment.`);
            }
            throw new Error(errorText.substring(0, 200)); // Limit error message length
          }
        } catch (parseErr: any) {
          throw new Error(parseErr.message || `HTTP ${res.status}: ${res.statusText}`);
        }
      }
      
      const json = await res.json();
      logger.debug("API Response received", { ok: json.ok, count: json.data?.length });
      
      if (json.ok) {
        setRequests(json.data || []);
        setLastUpdate(new Date());
        logger.success(`Successfully loaded ${json.data?.length || 0} requests`);
      } else {
        logger.error("API returned error", json.error);
        // Clean up error message if it contains HTML
        let errorMsg = json.error || "Unknown API error";
        if (typeof errorMsg === 'string' && (errorMsg.includes('<!DOCTYPE html>') || errorMsg.includes('Internal server error'))) {
          errorMsg = "Server error. Please try again in a moment.";
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      const logger = createLogger("SubmissionsView");
      logger.error("Failed to fetch submissions", err);
      // Show user-friendly error (limit message length)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const cleanMsg = errorMsg.length > 200 ? errorMsg.substring(0, 200) + '...' : errorMsg;
      alert(`Error loading submissions: ${cleanMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function viewDetails(request: Request) {
    const logger = createLogger("SubmissionsView");
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    // Default to Timeline tab to show tracking immediately
    
    // Use tracking API - it has the proper name fields and we'll fix the timestamp format
    try {
      const res = await fetch(`/api/requests/${request.id}/tracking`);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { error: errorText || `HTTP ${res.status}: ${res.statusText}` };
        }
        logger.error(`Failed to fetch request ${request.id} details`, errorJson);
        throw new Error(errorJson.error || `Failed to load request: ${res.status} ${res.statusText}`);
      }
      
      const json = await res.json();
      logger.debug(`Fetched request ${request.id} details`, { ok: json.ok, hasData: !!json.data });
      
      if (!json.ok || !json.data) {
        logger.error("Failed to fetch request details", json.error || "Unknown error");
        alert(`Error loading request details: ${json.error || "Unknown error"}`);
        setLoadingDetails(false);
        return;
      }
      
      // Only log debug info if data exists
      logger.debug('=== FULL API RESPONSE DEBUG ===');
      logger.debug('COMPLETE DATA', json.data);
      logger.debug('ALL SIGNATURES', {
        requester_signature: json.data?.requester_signature ? 'EXISTS (' + json.data.requester_signature.substring(0, 50) + '...)' : 'NULL',
        head_signature: json.data?.head_signature ? 'EXISTS (' + json.data.head_signature.substring(0, 50) + '...)' : 'NULL',
        admin_signature: json.data?.admin_signature ? 'EXISTS (' + json.data.admin_signature.substring(0, 50) + '...)' : 'NULL', 
        comptroller_signature: json.data?.comptroller_signature ? 'EXISTS (' + json.data.comptroller_signature.substring(0, 50) + '...)' : 'NULL',
        hr_signature: json.data?.hr_signature ? 'EXISTS (' + json.data.hr_signature.substring(0, 50) + '...)' : 'NULL',
        vp_signature: json.data?.vp_signature ? 'EXISTS (' + json.data.vp_signature.substring(0, 50) + '...)' : 'NULL',
        president_signature: json.data?.president_signature ? 'EXISTS (' + json.data.president_signature.substring(0, 50) + '...)' : 'NULL',
        exec_signature: json.data?.exec_signature ? 'EXISTS (' + json.data.exec_signature.substring(0, 50) + '...)' : 'NULL'
      });
      logger.debug('ALL TIMESTAMPS', {
        head_approved_at: json.data?.head_approved_at,
        admin_processed_at: json.data?.admin_processed_at,
        comptroller_approved_at: json.data?.comptroller_approved_at,
        hr_approved_at: json.data?.hr_approved_at,
        vp_approved_at: json.data?.vp_approved_at,
        president_approved_at: json.data?.president_approved_at,
        exec_approved_at: json.data?.exec_approved_at,
        final_approved_at: json.data?.final_approved_at
      });
      logger.debug('EXPENSE BREAKDOWN', {
        data: json.data?.expense_breakdown,
        type: typeof json.data?.expense_breakdown,
        length: json.data?.expense_breakdown?.length
      });
      logger.debug('=== VEHICLE/DRIVER DEBUG ===', {
        transportation_type: json.data?.transportation_type,
        cost_justification: json.data?.cost_justification,
        preferred_vehicle_id: json.data?.preferred_vehicle_id,
        preferred_driver_id: json.data?.preferred_driver_id,
        preferred_vehicle_note: json.data?.preferred_vehicle_note,
        preferred_driver_note: json.data?.preferred_driver_note,
        preferred_vehicle: json.data?.preferred_vehicle,
        preferred_driver: json.data?.preferred_driver
      });
      logger.debug('=== VP/PRESIDENT FIELD DEBUG ===', {
        vp_approved_at: json.data?.vp_approved_at,
        president_approved_at: json.data?.president_approved_at,
        exec_approved_at: json.data?.exec_approved_at,
        final_approved_at: json.data?.final_approved_at,
        vp_approved_by: json.data?.vp_approved_by,
        president_approved_by: json.data?.president_approved_by,
        exec_approved_by: json.data?.exec_approved_by
      });
      logger.debug('=== SEMINAR DATA DEBUG ===', {
        request_type: json.data?.request_type,
        seminar_data_exists: !!json.data?.seminar_data,
        seminar_data_type: typeof json.data?.seminar_data,
        seminar_data: json.data?.seminar_data
      });
      
        setFullRequestData(json.data);
    } catch (err) {
      logger.error("Failed to fetch request details", err);
      alert(`Error loading request details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingDetails(false);
    }
  }

  function getStatusColor(status: string) {
    if (status === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (status === "rejected" || status === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    if (status.startsWith("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  }

  function getStatusIcon(status: string) {
    if (status === "approved") return <CheckCircle className="h-4 w-4" />;
    if (status === "rejected" || status === "cancelled") return <XCircle className="h-4 w-4" />;
    if (status.startsWith("pending")) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRequestCard key={i} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-gray-500 mb-4">No submissions yet</div>
        <a
          href="/user/request"
          className="rounded-lg bg-[#7A0010] px-4 py-2 text-white hover:bg-[#5A0010] transition-colors"
        >
          Create Request
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Auto-refresh indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl"
      >
        <div className="flex items-center gap-3 text-sm text-green-700">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold">Live Updates Active</span>
          <span className="text-green-600">• Auto-refreshing every 3 seconds</span>
        </div>
        <div className="text-xs text-green-600 font-medium">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </motion.div>
      
      {/* Enhanced Request Cards */}
      <div className="space-y-4">
        {requests.map((req, index) => {
          const isApproved = req.status === 'approved';
          
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3"
            >
              <RequestCardEnhanced
                request={{
                  id: req.id,
                  request_number: req.request_number,
                  file_code: (req as any).file_code,
                  title: req.title,
                  purpose: req.purpose,
                  destination: req.destination,
                  travel_start_date: req.travel_start_date,
                  travel_end_date: req.travel_end_date,
                  status: req.status,
                  created_at: req.created_at,
                  total_budget: req.total_budget,
                  request_type: req.request_type,
                  requester_name: req.requester_name,
                  requester: {
                    name: req.requester_name,
                    email: (req as any).requester?.email,
                    profile_picture: (req as any).requester?.profile_picture,
                    department: req.department?.name,
                    position: (req as any).requester?.position_title,
                  },
                  department: req.department || undefined,
                  submitted_by_name: (req as any).submitted_by_name,
                  is_representative: (req as any).is_representative,
                  requester_signed_at: (req as any).requester_signed_at,
                  requester_signature: (req as any).requester_signature,
                }}
                showActions={true}
                onView={() => viewDetails(req)}
                onDownload={isApproved ? () => {
                  // Download PDF
                  window.open(`/api/requests/${req.id}/pdf`, '_blank');
                } : undefined}
              />
              
              {/* Payment Confirmation Button - Show if payment required */}
              {req.status === "pending_comptroller" && (req as any).payment_required && !(req as any).payment_confirmed && (
                <div className="px-2">
                  <PaymentConfirmationButton
                    requestId={req.id}
                    requestNumber={req.request_number}
                    totalBudget={req.total_budget || 0}
                    editedBudget={(req as any).comptroller_edited_budget}
                    onConfirmed={() => {
                      // Refresh submissions after payment confirmation
                      fetchSubmissions();
                    }}
                  />
                </div>
              )}
              
              {/* Mini Progress Tracker */}
              <div className="px-2">
                <RequestStatusTracker
                  status={req.status as any}
                  requesterIsHead={(req as any).requester_is_head || false}
                  hasBudget={req.has_budget}
                  hasParentHead={(req as any).has_parent_head || false}
                  requiresPresidentApproval={(req as any).requester_is_head || req.total_budget > 50000}
                  compact={true}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAILS MODAL */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        size="lg"
        showCloseButton={true}
      >
        {loadingDetails ? (
          <div className="p-6 space-y-6">
            {/* Skeleton Header */}
            <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-8 bg-white/30 rounded w-48 mb-2"></div>
                  <div className="h-6 bg-white/20 rounded w-96 mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-white/20 rounded w-32"></div>
                    <div className="h-4 bg-white/20 rounded w-40"></div>
                  </div>
                </div>
                <div className="h-8 bg-white/30 rounded w-24"></div>
              </div>
            </div>
            
            {/* Skeleton Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Skeleton Details Card */}
                <div className="bg-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
                
                {/* Skeleton Timeline */}
                <div className="bg-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Skeleton Sidebar */}
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
        ) : selectedRequest && fullRequestData ? (
          <RequestDetailsView
            request={{
              id: selectedRequest.id,
              request_number: selectedRequest.request_number,
              title: selectedRequest.title || selectedRequest.purpose,
              purpose: selectedRequest.purpose,
              destination: selectedRequest.destination,
              travel_start_date: selectedRequest.travel_start_date,
              travel_end_date: selectedRequest.travel_end_date,
              total_budget: selectedRequest.total_budget || 0,
              created_at: selectedRequest.created_at,
              expense_breakdown: fullRequestData?.expense_breakdown || [],
              transportation_type: fullRequestData?.transportation_type || null,
              pickup_location: fullRequestData?.pickup_location || null,
              pickup_time: fullRequestData?.pickup_time || null,
              cost_justification: fullRequestData?.cost_justification || null,
              preferred_vehicle: fullRequestData?.preferred_vehicle || null, // Now resolved to vehicle name from API
              preferred_driver: fullRequestData?.preferred_driver || null, // Now resolved to driver name from API
              preferred_vehicle_note: fullRequestData?.preferred_vehicle_note || null,
              preferred_driver_note: fullRequestData?.preferred_driver_note || null,
              status: selectedRequest.status,
              
              // Workflow metadata for routing information
              workflow_metadata: fullRequestData?.workflow_metadata || (selectedRequest as any).workflow_metadata || {},
              
              // Seminar data
              request_type: fullRequestData?.request_type || selectedRequest.request_type || 'travel_order',
              seminar_data: (() => {
                const seminarData = fullRequestData?.seminar_data || selectedRequest.seminar_data;
                if (!seminarData) return undefined;
                if (typeof seminarData === 'string') {
                  try {
                    return JSON.parse(seminarData);
                  } catch (e) {
                    logger.warn('Failed to parse seminar_data:', e);
                    return undefined;
                  }
                }
                return seminarData;
              })(),
              
              requester: {
                id: fullRequestData?.requester?.id || 'current-user',
                name: fullRequestData?.requester?.name || selectedRequest.requester_name || 'Unknown User',
                profile_picture: fullRequestData?.requester?.profile_picture || undefined,
                department: fullRequestData?.requester?.department?.name || selectedRequest.department?.name || 'No Department',
                position: fullRequestData?.requester?.position_title || (fullRequestData?.requester_is_head ? 'Department Head' : 'Faculty/Staff'),
                email: fullRequestData?.requester?.email || undefined,
                phone: fullRequestData?.requester?.phone_number || undefined
              },
              
              department: selectedRequest.department ? {
                id: 'dept-1',
                name: selectedRequest.department.name,
                code: selectedRequest.department.code
              } : {
                id: 'dept-1',
                name: 'Unknown',
                code: 'UNK'
              },
              
              participants: fullRequestData?.participants || [],
              
              // Attachments
              attachments: (() => {
                // Parse attachments if it's a string (JSONB from database)
                let attachments = fullRequestData?.attachments || selectedRequest.attachments || [];
                if (typeof attachments === 'string') {
                  try {
                    attachments = JSON.parse(attachments);
                  } catch (e) {
                    logger.warn('Failed to parse attachments:', e);
                    attachments = [];
                  }
                }
                // Ensure it's an array
                return Array.isArray(attachments) ? attachments : [];
              })(),
              
              // Requester signature
              requester_signature: fullRequestData?.requester_signature || null,
              
              // Additional form fields
              destination_geo: fullRequestData?.destination_geo || null,
              vehicle_mode: fullRequestData?.vehicle_mode || null,
              preferred_driver_name: fullRequestData?.preferred_driver_name || null,
              preferred_vehicle_name: fullRequestData?.preferred_vehicle_name || null,
              reason_of_trip: fullRequestData?.workflow_metadata?.reason_of_trip || null,
              department_head_endorsed_by: fullRequestData?.workflow_metadata?.department_head_endorsed_by || null,
              department_head_endorsement_date: fullRequestData?.workflow_metadata?.department_head_endorsement_date || null,
              pickup_preference: fullRequestData?.pickup_preference || null,
              pickup_location_lat: fullRequestData?.pickup_location_lat || null,
              pickup_location_lng: fullRequestData?.pickup_location_lng || null,
              pickup_contact_number: fullRequestData?.pickup_contact_number || null,
              pickup_special_instructions: fullRequestData?.pickup_special_instructions || null,
              return_transportation_same: fullRequestData?.return_transportation_same ?? null,
              dropoff_location: fullRequestData?.dropoff_location || null,
              dropoff_time: fullRequestData?.dropoff_time || null,
              parking_required: fullRequestData?.parking_required ?? null,
              own_vehicle_details: fullRequestData?.own_vehicle_details || null,
              
              // Complete signature workflow chain
              // For head requests: skip head signature (dual-signature - same as requester)
              // For head requests: must go through VP and President (both required)
              signatures: (() => {
                const requesterIsHead = fullRequestData?.requester_is_head || false;
                const hasBudget = fullRequestData?.has_budget || false;
                const requiresPresidentApproval = requesterIsHead || ((fullRequestData?.total_budget || 0) > 50000);
                
                const signatures: any[] = [
                {
                  id: 'requester',
                  label: 'Requesting Person',
                  role: 'Requester',
                  status: 'approved',
                  approver: {
                    id: 'current-user',
                    name: selectedRequest.requester_name || 'Unknown User',
                    profile_picture: undefined,
                    department: selectedRequest.department?.name || 'No Department',
                    position: requesterIsHead ? 'Department Head' : 'Faculty/Staff'
                  },
                  signature: fullRequestData?.requester_signature || null,
                  approved_at: selectedRequest.created_at
                },
              ];
              
              // Only add head signature stage if requester is NOT a head
              // (Head requests use dual-signature - requester signature appears in both places)
              // DO NOT add head signature stage for head requesters - they already signed as requester
              if (!requesterIsHead) {
                // Get head approver data from API response
                const headApprover = fullRequestData?.head_approver || fullRequestData?.parent_head_approver;
                const hasHeadApproval = !!(fullRequestData?.head_signature || fullRequestData?.parent_head_signature || fullRequestData?.head_approved_at || fullRequestData?.parent_head_approved_at);
                
                signatures.push({
                  id: 'head',
                  label: fullRequestData?.parent_head_approved_at ? 'Parent Department Head' : 'Department Head',
                  role: 'Head',
                  status: hasHeadApproval ? 'approved' : 'pending',
                  approver: hasHeadApproval && headApprover ? {
                    id: headApprover.id || 'dept-head',
                    name: headApprover.name || 'Department Head',
                    position: headApprover.position_title || 'Department Head',
                    department: headApprover.department?.name || selectedRequest.department?.name || 'No Department',
                    profile_picture: headApprover.profile_picture
                  } : undefined,
                  signature: fullRequestData?.parent_head_signature || fullRequestData?.head_signature || null,
                  approved_at: fullRequestData?.parent_head_approved_at || fullRequestData?.head_approved_at || null
                });
              }
              // For head requesters: Skip head signature stage entirely (dual-signature logic)
              
              // Admin - always required
              signatures.push({
                id: 'admin',
                label: 'Administrator',
                role: 'Admin',
                status: fullRequestData?.admin_processed_at ? 'approved' : 'pending',
                approver: fullRequestData?.admin_processed_at ? {
                  id: 'admin',
                  name: fullRequestData?.admin_processed_by || 'Administrator',
                  position: 'Administrative Officer',
                  department: 'Administration'
                } : undefined,
                signature: fullRequestData?.admin_signature || null,
                approved_at: fullRequestData?.admin_processed_at || null
              });
              
              // Comptroller - only if has budget
              if (hasBudget) {
                signatures.push({
                  id: 'comptroller',
                  label: 'Comptroller',
                  role: 'Comptroller',
                  status: fullRequestData?.comptroller_approved_at ? 'approved' : 'pending',
                  approver: fullRequestData?.comptroller_approved_at ? {
                    id: 'comptroller',
                    name: fullRequestData?.comptroller_approved_by || 'Comptroller',
                    position: 'University Comptroller',
                    department: 'Finance'
                  } : undefined,
                  signature: fullRequestData?.comptroller_signature || null,
                  approved_at: fullRequestData?.comptroller_approved_at || null
                });
              }
              
              // HR - always required
              signatures.push({
                id: 'hr',
                label: 'Human Resources',
                role: 'HR',
                status: fullRequestData?.hr_signature ? 'approved' : 'pending',
                approver: fullRequestData?.hr_signature ? {
                  id: 'hr',
                  name: fullRequestData?.hr_approved_by || 'HR Manager',
                  position: 'HR Manager',
                  department: 'Human Resources'
                } : undefined,
                signature: fullRequestData?.hr_signature || null,
                approved_at: fullRequestData?.hr_approved_at || null
              });
              
              // VP - always required (head requests go through VP then President)
              signatures.push({
                id: 'vp',
                label: 'Vice President',
                role: 'VP',
                status: fullRequestData?.vp_signature ? 'approved' : 'pending',
                approver: fullRequestData?.vp_signature ? {
                  id: 'vp',
                  name: fullRequestData?.vp_approved_by || 'Vice President',
                  position: 'Vice President for Academic Affairs',
                  department: 'Executive'
                } : undefined,
                signature: fullRequestData?.vp_signature || null,
                approved_at: fullRequestData?.vp_approved_at || null
              });
              
              // President - required for head requests OR high-value requests (>50k)
              if (requiresPresidentApproval) {
                signatures.push({
                  id: 'president',
                  label: 'University President',
                  role: 'President',
                  status: fullRequestData?.president_signature ? 'approved' : 'pending',
                  approver: fullRequestData?.president_signature ? {
                    id: 'president',
                    name: fullRequestData?.president_approved_by || 'University President',
                    position: 'University President',
                    department: 'Executive'
                  } : undefined,
                  signature: fullRequestData?.president_signature || null,
                  approved_at: fullRequestData?.president_approved_at || null
                });
              }
              
              return signatures;
            })(),
              
              // Mock timeline for now - replace with real data from API
              timeline: [
                {
                  id: '1',
                  type: 'submitted',
                  title: 'Request Submitted',
                  description: `Travel request ${selectedRequest.request_number} was submitted for approval`,
                  actor: {
                    id: 'current-user',
                    name: selectedRequest.requester_name || 'Unknown User',
                    profile_picture: undefined,
                    department: selectedRequest.department?.name || 'No Department',
                    position: 'Faculty/Staff'
                  },
                  timestamp: selectedRequest.created_at
                }
              ],
              
              smart_skips_applied: [],
              efficiency_boost: undefined,
              requires_budget: selectedRequest.has_budget,
              
              // Status tracking props for RequestStatusTracker
              requesterIsHead: fullRequestData?.requester_is_head || false,
              hasBudget: fullRequestData?.has_budget || false,
              hasParentHead: fullRequestData?.has_parent_head || false,
              requiresPresidentApproval: (fullRequestData?.requester_is_head || false) || ((fullRequestData?.total_budget || 0) > 50000),
              headApprovedAt: fullRequestData?.head_approved_at || null,
              headApprovedBy: fullRequestData?.head_approved_by || null,
              parentHeadApprovedAt: fullRequestData?.parent_head_approved_at || null,
              parentHeadApprovedBy: fullRequestData?.parent_head_approved_by || null,
              adminProcessedAt: fullRequestData?.admin_processed_at || null,
              adminProcessedBy: fullRequestData?.admin_processed_by || null,
              comptrollerApprovedAt: fullRequestData?.comptroller_approved_at || null,
              comptrollerApprovedBy: fullRequestData?.comptroller_approved_by || null,
              hrApprovedAt: fullRequestData?.hr_approved_at || null,
              hrApprovedBy: fullRequestData?.hr_approved_by || null,
              vpApprovedAt: fullRequestData?.vp_approved_at || null,
              vpApprovedBy: fullRequestData?.vp_approved_by || null,
              presidentApprovedAt: fullRequestData?.president_approved_at || null,
              presidentApprovedBy: fullRequestData?.president_approved_by || null,
              execApprovedAt: fullRequestData?.exec_approved_at || null,
              execApprovedBy: fullRequestData?.exec_approved_by || null,
              rejectedAt: fullRequestData?.rejected_at || null,
              rejectedBy: fullRequestData?.rejected_by || null,
              rejectionStage: fullRequestData?.rejection_stage || null
            }}
            onPrint={() => window.print()}
            onClose={() => setShowDetailsModal(false)}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No request data available</p>
            <p className="text-sm mt-2">Please try refreshing the page</p>
          </div>
        )}
      </Modal>
    </>
  );
}
