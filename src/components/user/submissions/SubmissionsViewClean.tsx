"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { SkeletonRequestCard } from "@/components/common/ui/Skeleton";
import ComprehensiveRequestModal from "@/components/user/ComprehensiveRequestModal";
import RequestCard from "@/components/common/RequestCardWow";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import Modal from "@/components/common/Modal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";

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
  department: {
    code: string;
    name: string;
  };
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
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
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
    try {
      console.log("Fetching submissions from /api/requests/my-submissions...");
      const res = await fetch("/api/requests/my-submissions");
      
      console.log("Response status:", res.status, res.statusText);
      
      if (!res.ok) {
        // Try to get error details from response
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }
      
      const json = await res.json();
      console.log("API Response:", json);
      
      if (json.ok) {
        setRequests(json.data || []);
        setLastUpdate(new Date());
        console.log("Successfully loaded", json.data?.length || 0, "requests");
      } else {
        console.error("API returned error:", json.error);
        throw new Error(json.error || "Unknown API error");
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      // Show user-friendly error
      alert(`Error loading submissions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  function viewTracking(request: Request) {
    setSelectedRequest(request);
    setShowTrackingModal(true);
  }

  async function viewDetails(request: Request) {
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    // Use tracking API - it has the proper name fields and we'll fix the timestamp format
    try {
      const res = await fetch(`/api/requests/${request.id}/tracking`);
      const json = await res.json();
      console.log(`Fetched request ${request.id} details:`, json);
      console.log('=== FULL API RESPONSE DEBUG ===');
      console.log('COMPLETE DATA:', json.data);
      console.log('ALL SIGNATURES:', {
        requester_signature: json.data.requester_signature ? 'EXISTS (' + json.data.requester_signature.substring(0, 50) + '...)' : 'NULL',
        head_signature: json.data.head_signature ? 'EXISTS (' + json.data.head_signature.substring(0, 50) + '...)' : 'NULL',
        admin_signature: json.data.admin_signature ? 'EXISTS (' + json.data.admin_signature.substring(0, 50) + '...)' : 'NULL', 
        comptroller_signature: json.data.comptroller_signature ? 'EXISTS (' + json.data.comptroller_signature.substring(0, 50) + '...)' : 'NULL',
        hr_signature: json.data.hr_signature ? 'EXISTS (' + json.data.hr_signature.substring(0, 50) + '...)' : 'NULL',
        vp_signature: json.data.vp_signature ? 'EXISTS (' + json.data.vp_signature.substring(0, 50) + '...)' : 'NULL',
        president_signature: json.data.president_signature ? 'EXISTS (' + json.data.president_signature.substring(0, 50) + '...)' : 'NULL',
        exec_signature: json.data.exec_signature ? 'EXISTS (' + json.data.exec_signature.substring(0, 50) + '...)' : 'NULL'
      });
      console.log('ALL TIMESTAMPS:', {
        head_approved_at: json.data.head_approved_at,
        admin_processed_at: json.data.admin_processed_at,
        comptroller_approved_at: json.data.comptroller_approved_at,
        hr_approved_at: json.data.hr_approved_at,
        vp_approved_at: json.data.vp_approved_at,
        president_approved_at: json.data.president_approved_at,
        exec_approved_at: json.data.exec_approved_at,
        final_approved_at: json.data.final_approved_at
      });
      console.log('EXPENSE BREAKDOWN:', json.data.expense_breakdown);
      console.log('EXPENSE BREAKDOWN TYPE:', typeof json.data.expense_breakdown);
      console.log('EXPENSE BREAKDOWN LENGTH:', json.data.expense_breakdown?.length);
      console.log('=== VEHICLE/DRIVER DEBUG ===');
      console.log('transportation_type:', json.data.transportation_type);
      console.log('cost_justification:', json.data.cost_justification);
      console.log('preferred_vehicle_id:', json.data.preferred_vehicle_id);
      console.log('preferred_driver_id:', json.data.preferred_driver_id);
      console.log('preferred_vehicle_note:', json.data.preferred_vehicle_note);
      console.log('preferred_driver_note:', json.data.preferred_driver_note);
      console.log('=== RESOLVED NAMES ===');
      console.log('preferred_vehicle (resolved):', json.data.preferred_vehicle);
      console.log('preferred_driver (resolved):', json.data.preferred_driver);
      console.log('=== END DEBUG ===');
      // DETAILED VP/President field check
      console.log('=== VP/PRESIDENT FIELD DEBUG ===');
      console.log('vp_approved_at:', json.data.vp_approved_at);
      console.log('president_approved_at:', json.data.president_approved_at);
      console.log('exec_approved_at:', json.data.exec_approved_at);
      console.log('final_approved_at:', json.data.final_approved_at);
      console.log('vp_approved_by:', json.data.vp_approved_by);
      console.log('president_approved_by:', json.data.president_approved_by);
      console.log('exec_approved_by:', json.data.exec_approved_by);
      console.log('=== END FIELD DEBUG ===');
      
      if (json.ok && json.data) {
        setFullRequestData(json.data);
      } else {
        console.error("Failed to fetch request details:", json.error || "Unknown error");
        alert(`Error loading request details: ${json.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to fetch request details:", err);
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
      
      {/* WOW FACTOR REQUEST CARDS */}
      <div className="space-y-6">
        {requests.map((req, index) => {
          // Transform request data to match RequestCardWow interface
          const transformedRequest = {
            id: req.id,
            request_number: req.request_number,
            title: req.title || req.purpose,
            status: req.status,
            destination: req.destination,
            departure_date: req.travel_start_date,
            requester: {
              id: 'current-user',
              name: req.requester_name || 'Unknown User', // Use actual requester name
              department: req.department.name,
              profile_picture: undefined,
              position: 'Faculty/Staff'
            },
            total_budget: req.total_budget,
            smart_skips_applied: [], // This would come from smart workflow data
            efficiency_boost: undefined,
            priority: 'medium' as const
          };

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <RequestCard
                request={transformedRequest}
                showActions={true}
                onView={() => viewDetails(req)}
                onTrack={() => viewTracking(req)}
                className="hover:shadow-xl transition-all duration-300"
              />
              
              {/* Mini Progress Tracker */}
              <div className="px-4 pb-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Approval Progress
                </div>
                <RequestStatusTracker
                  status={req.status as any}
                  requesterIsHead={(req as any).requester_is_head || false}
                  hasBudget={req.has_budget}
                  hasParentHead={(req as any).has_parent_head || false}
                  requiresPresidentApproval={req.total_budget > 50000} // Example: President approval required for budget > 50k
                  compact={true}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comprehensive Request Modal */}
      {selectedRequest && (
        <ComprehensiveRequestModal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          requestId={selectedRequest.id}
        />
      )}

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
              
              requester: {
                id: 'current-user',
                name: selectedRequest.requester_name || 'Unknown User',
                profile_picture: undefined,
                department: selectedRequest.department.name,
                position: 'Faculty/Staff',
                email: undefined,
                phone: undefined
              },
              
              department: {
                id: 'dept-1',
                name: selectedRequest.department.name,
                code: selectedRequest.department.code
              },
              
              participants: fullRequestData?.participants || [],
              
              // Complete signature workflow chain
              signatures: [
                {
                  id: 'requester',
                  label: 'Requesting Person',
                  role: 'Requester',
                  status: 'approved',
                  approver: {
                    id: 'current-user',
                    name: selectedRequest.requester_name || 'Unknown User',
                    profile_picture: undefined,
                    department: selectedRequest.department.name,
                    position: 'Faculty/Staff'
                  },
                  signature: fullRequestData?.requester_signature || null,
                  approved_at: selectedRequest.created_at
                },
                {
                  id: 'head',
                  label: 'Department Head',
                  role: 'Head',
                  status: fullRequestData?.head_signature ? 'approved' : 'pending',
                  approver: fullRequestData?.head_signature ? {
                    id: 'dept-head',
                    name: fullRequestData?.head_approved_by || 'Department Head',
                    position: 'Department Head',
                    department: selectedRequest.department.name
                  } : undefined,
                  signature: fullRequestData?.head_signature || null,
                  approved_at: fullRequestData?.head_approved_at || null
                },
                {
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
                },
                {
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
                },
                {
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
                },
                {
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
                },
                {
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
                }
              ],
              
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
                    department: selectedRequest.department.name,
                    position: 'Faculty/Staff'
                  },
                  timestamp: selectedRequest.created_at
                }
              ],
              
              smart_skips_applied: [],
              efficiency_boost: undefined,
              requires_budget: selectedRequest.has_budget
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
