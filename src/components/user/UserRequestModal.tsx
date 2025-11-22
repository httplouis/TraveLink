"use client";

import * as React from "react";
import { X, CheckCircle, Calendar, MapPin, DollarSign, FileText, User, Users, Building2, Car, UserCheck, Clock, History, UserCog, CheckCircle2 } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/Toast";
import SignConfirmationDialog from "@/components/user/request/SignConfirmationDialog";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";

type Props = {
  request: any;
  onClose: () => void;
  onSigned: () => void;
};

type HistoryEntry = {
  id: string;
  action: string;
  actor_role: string;
  comments?: string;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
  metadata?: any;
};

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-PH", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export default function UserRequestModal({
  request,
  onClose,
  onSigned,
}: Props) {
  const toast = useToast();
  const [signature, setSignature] = React.useState<string>(request.requester_signature || "");
  const [submitting, setSubmitting] = React.useState(false);
  const [fullRequestData, setFullRequestData] = React.useState<any>(null);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [loadingDetails, setLoadingDetails] = React.useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [preferredDriverName, setPreferredDriverName] = React.useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = React.useState<string>("");

  const expenseBreakdown = request.expense_breakdown || fullRequestData?.expense_breakdown || [];
  const totalBudget = request.comptroller_edited_budget || fullRequestData?.comptroller_edited_budget || request.total_budget || fullRequestData?.total_budget || 0;

  // Fetch full request details and history when modal opens
  React.useEffect(() => {
    async function fetchFullDetails() {
      try {
        setLoadingDetails(true);
        const res = await fetch(`/api/requests/${request.id}/history`);
        const data = await res.json();
        
        console.log("[UserRequestModal] History API response:", data);
        
        if (data.ok) {
          setFullRequestData(data.data.request);
          const fetchedHistory = data.data.history || [];
          console.log("[UserRequestModal] Fetched history entries:", fetchedHistory.length);
          
          const reqData = data.data.request || request;
          
          // Load preferred driver
          if (reqData.preferred_driver_id) {
            try {
              const driverRes = await fetch(`/api/users/${reqData.preferred_driver_id}`);
              const driverData = await driverRes.json();
              if (driverData.ok && driverData.data) {
                setPreferredDriverName(driverData.data.name || "Unknown Driver");
              }
            } catch (err) {
              console.error("[UserRequestModal] Failed to load driver:", err);
            }
          }

          // Load preferred vehicle
          if (reqData.preferred_vehicle_id) {
            try {
              const vehicleRes = await fetch(`/api/vehicles/${reqData.preferred_vehicle_id}`);
              const vehicleData = await vehicleRes.json();
              if (vehicleData.ok && vehicleData.data) {
                setPreferredVehicleName(vehicleData.data.name || vehicleData.data.plate_number || "Unknown Vehicle");
              }
            } catch (err) {
              console.error("[UserRequestModal] Failed to load vehicle:", err);
            }
          }
          
          // Always add a "created" entry if history is empty and we have request data
          if (fetchedHistory.length === 0 && reqData) {
            const createdEntry: HistoryEntry = {
              id: `created-${reqData.id}`,
              action: "created",
              actor_role: reqData.is_representative ? "submitter" : "requester",
              comments: reqData.is_representative 
                ? `Request submitted on behalf of ${reqData.requester?.name || reqData.requester_name || "requester"} by ${reqData.submitted_by?.name || reqData.submitted_by_name || "submitter"}`
                : "Request created and submitted",
              created_at: reqData.created_at || new Date().toISOString(),
              actor: reqData.is_representative 
                ? (reqData.submitted_by || { id: reqData.submitted_by_user_id, name: reqData.submitted_by_name })
                : (reqData.requester || { id: reqData.requester_id, name: reqData.requester_name }),
            };
            setHistory([createdEntry]);
            console.log("[UserRequestModal] Added fallback created entry");
          } else {
            setHistory(fetchedHistory);
          }
        } else {
          console.error("[UserRequestModal] History API error:", data.error);
          // Fallback: create entry from request data
          const createdEntry: HistoryEntry = {
            id: `created-${request.id}`,
            action: "created",
            actor_role: request.is_representative ? "submitter" : "requester",
            comments: request.is_representative 
              ? `Request submitted on behalf of you by ${request.submitted_by_name || "submitter"}`
              : "Request created and submitted",
            created_at: request.created_at || new Date().toISOString(),
            actor: request.submitted_by || request.requester,
          };
          setHistory([createdEntry]);
        }
      } catch (err) {
        console.error("[UserRequestModal] Failed to load full details:", err);
        // Fallback: create entry from request data
        const createdEntry: HistoryEntry = {
          id: `created-${request.id}`,
          action: "created",
          actor_role: request.is_representative ? "submitter" : "requester",
          comments: request.is_representative 
            ? `Request submitted on behalf of you by ${request.submitted_by_name || "submitter"}`
            : "Request created and submitted",
          created_at: request.created_at || new Date().toISOString(),
          actor: request.submitted_by || request.requester,
        };
        setHistory([createdEntry]);
      } finally {
        setLoadingDetails(false);
      }
    }
    
    if (request.id) {
      fetchFullDetails();
    }
  }, [request.id]);

  const requestData = fullRequestData || request;

  function handleSignClick() {
    if (!signature || signature.trim() === "") {
      toast.error("Signature required", "Please provide your signature to approve this request.");
      return;
    }

    // Show confirmation dialog first
    setShowConfirmDialog(true);
  }

  async function handleSign() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/user/inbox/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          signature: signature,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to sign request");
      }

      toast.success("Request signed", "Your request has been signed and forwarded to your department head.");

      setShowConfirmDialog(false);
      onSigned();
      onClose();
    } catch (err: any) {
      toast.error("Sign failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Request Details & Signature
            </h2>
            {requestData.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {requestData.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              requestData.status === 'pending_requester_signature' ? 'bg-amber-100 text-amber-700' :
              requestData.status === 'pending_head' ? 'bg-blue-100 text-blue-700' :
              requestData.status === 'approved' ? 'bg-green-100 text-green-700' :
              requestData.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {requestData.status === 'pending_requester_signature' ? 'Awaiting Your Signature' :
               requestData.status === 'pending_head' ? 'Pending Head Review' :
               requestData.status === 'approved' ? 'Approved' :
               requestData.status === 'rejected' ? 'Rejected' :
               requestData.status || 'Pending'}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto flex-1">
          {loadingDetails ? (
            <div className="col-span-2 text-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A0010] border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading full details...</p>
            </div>
          ) : (
            <>
              {/* LEFT */}
              <div className="space-y-5">
                {/* Requester Information */}
                <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                    Requesting Person
                  </p>
                  
                  {requestData.is_representative && requestData.submitted_by_name ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {(requestData.requester?.profile_picture || requestData.requester?.avatar_url) ? (
                          <img 
                            src={requestData.requester.profile_picture || requestData.requester.avatar_url} 
                            alt={requestData.requester_name || "Requester"}
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-avatar')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                                fallback.textContent = (requestData.requester_name || "U").charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(requestData.requester_name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-semibold text-slate-900">
                              <NameWithProfile
                                name={requestData.requester_name || requestData.requester?.name || "Unknown Requester"}
                                profile={{
                                  id: requestData.requester?.id || '',
                                  name: requestData.requester_name || requestData.requester?.name || '',
                                  email: requestData.requester?.email,
                                  department: requestData.department?.name || requestData.department?.code,
                                  position: requestData.requester?.position_title,
                                  profile_picture: requestData.requester?.profile_picture,
                                }}
                              />
                            </p>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                              On behalf
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {requestData.department?.name || requestData.department?.code || "No department indicated"}
                          </p>
                        </div>
                      </div>
                      <div className="pl-[64px] border-l-2 border-slate-200 ml-3 pt-2">
                        <p className="text-xs text-slate-500 mb-1.5 font-medium">Submitted by</p>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                            {requestData.submitted_by_name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-slate-900">{requestData.submitted_by_name}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {(requestData.requester?.profile_picture || requestData.requester?.avatar_url) ? (
                        <img 
                          src={requestData.requester.profile_picture || requestData.requester.avatar_url} 
                          alt={requestData.requester_name || "Requester"}
                          className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-avatar')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                              fallback.textContent = (requestData.requester_name || "U").charAt(0).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(requestData.requester_name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 mb-1">
                          <NameWithProfile
                            name={requestData.requester_name || requestData.requester?.name || requestData.requester?.email || "Unknown Requester"}
                            profile={{
                              id: requestData.requester?.id || '',
                              name: requestData.requester_name || requestData.requester?.name || '',
                              email: requestData.requester?.email,
                              department: requestData.department?.name || requestData.department?.code,
                              position: requestData.requester?.position_title,
                              profile_picture: requestData.requester?.profile_picture,
                            }}
                          />
                        </p>
                        <p className="text-sm text-slate-600">
                          {requestData.department?.name || requestData.department?.code || "No department indicated"}
                        </p>
                        {requestData.requester?.position_title && (
                          <p className="text-xs text-slate-500 mt-0.5">{requestData.requester.position_title}</p>
                        )}
                        {requestData.requester?.role && (
                          <p className="text-xs text-slate-500 mt-0.5">Role: {requestData.requester.role}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {requestData.created_at && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Submitted {new Date(requestData.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  )}
                </section>

                {/* Service Preferences */}
                <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                    Service Preferences
                  </p>
                  
                  {(requestData.preferred_driver_id || requestData.preferred_vehicle_id || preferredDriverName || preferredVehicleName) ? (
                    <div className="space-y-3">
                      {(requestData.preferred_driver_id || preferredDriverName) ? (
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                            <UserCog className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Preferred Driver</p>
                            <p className="text-sm font-medium text-slate-900">
                              {preferredDriverName || requestData.preferred_driver?.name || "Loading..."}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      
                      {(requestData.preferred_vehicle_id || preferredVehicleName || requestData.preferred_vehicle) ? (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                            <Car className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Preferred Vehicle</p>
                            <p className="text-sm font-medium text-slate-900">
                              {preferredVehicleName || requestData.preferred_vehicle?.vehicle_name || requestData.preferred_vehicle?.plate_number || "Loading..."}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
                        <Car className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600">No driver or vehicle preferences</p>
                      <p className="text-xs text-slate-500 mt-1">Admin will assign resources</p>
                    </div>
                  )}
                </section>

                {/* Request Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <section className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 mb-2">
                      <FileText className="h-4 w-4" />
                      Purpose
                    </p>
                    <p className="text-sm text-slate-800 font-medium">
                      {requestData.purpose || "No purpose indicated"}
                    </p>
                  </section>
                  <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                      <Calendar className="h-4 w-4" />
                      Travel Dates
                    </p>
                    <p className="text-sm text-slate-800 font-medium">
                      {requestData.travel_start_date && requestData.travel_end_date
                        ? `${new Date(requestData.travel_start_date).toLocaleDateString()} – ${new Date(requestData.travel_end_date).toLocaleDateString()}`
                        : "—"}
                    </p>
                  </section>
                  <section className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-1.5 mb-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </p>
                    <p className="text-lg font-bold text-[#7A0010]">
                      {peso(totalBudget)}
                    </p>
                  </section>
                </div>

                {/* Transportation Mode */}
                {requestData.vehicle_mode && (
                  <section className="rounded-lg p-4 border-2 shadow-sm" style={{
                    backgroundColor: requestData.vehicle_mode === 'owned' ? '#f0fdf4' : requestData.vehicle_mode === 'rent' ? '#fefce8' : '#eff6ff',
                    borderColor: requestData.vehicle_mode === 'owned' ? '#86efac' : requestData.vehicle_mode === 'rent' ? '#fde047' : '#93c5fd'
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                        backgroundColor: requestData.vehicle_mode === 'owned' ? '#d1fae5' : requestData.vehicle_mode === 'rent' ? '#fef3c7' : '#dbeafe'
                      }}>
                        <Car className="h-5 w-5" style={{
                          color: requestData.vehicle_mode === 'owned' ? '#059669' : requestData.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                        }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{
                          color: requestData.vehicle_mode === 'owned' ? '#059669' : requestData.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                        }}>
                          Transportation Mode
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {requestData.vehicle_mode === 'owned' && 'Personal Vehicle (Owned)'}
                          {requestData.vehicle_mode === 'institutional' && 'University Vehicle'}
                          {requestData.vehicle_mode === 'rent' && 'Rental Vehicle'}
                          {!requestData.vehicle_mode && (requestData.vehicle_type || 'Not specified')}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Destination */}
                {requestData.destination && (
                  <section className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Destination
                      </p>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 flex-1">
                        {requestData.destination}
                      </p>
                      <button
                        onClick={() => {
                          const encodedDest = encodeURIComponent(requestData.destination);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDest}`, '_blank');
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                        title="View on Google Maps"
                      >
                        <MapPin className="h-4 w-4" />
                        View Map
                      </button>
                    </div>
                  </section>
                )}

                {/* Participants */}
                {requestData.participants && Array.isArray(requestData.participants) && requestData.participants.length > 0 && (
                  <section className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                        Travel Participants ({requestData.participants.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {requestData.participants.map((participant: any, idx: number) => {
                        const participantName = typeof participant === 'string' 
                          ? participant 
                          : participant?.name || participant?.id || `Participant ${idx + 1}`;
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-100">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-purple-700">
                                {participantName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-900">{participantName}</span>
                          </div>
                        );
                      })}
                    </div>
                    {requestData.head_included && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Department Head is included in travel
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Previous Approvals */}
                <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-700 mb-3">
                    Previous Approvals
                  </p>
                  <div className="space-y-3">
                    {requestData.head_approved_at && (
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">Head Approved</p>
                          <span className="text-xs text-green-600 font-medium">
                            {new Date(requestData.head_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        {requestData.head_approved_by && (
                          <p className="text-xs text-slate-600">
                            By: {requestData.head_approver?.name || requestData.head_signed_by || "Department Head"}
                          </p>
                        )}
                        {requestData.head_signature && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <img
                              src={requestData.head_signature}
                              alt="Head signature"
                              className="h-16 w-full object-contain"
                            />
                          </div>
                        )}
                        {requestData.head_comments && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">Comments:</p>
                            <p className="text-xs text-slate-700">{requestData.head_comments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {requestData.hr_approved_at && (
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">HR Approved</p>
                          <span className="text-xs text-green-600 font-medium">
                            {new Date(requestData.hr_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        {requestData.hr_approved_by && (
                          <p className="text-xs text-slate-600">
                            By: {requestData.hr_approver?.name || "HR Officer"}
                          </p>
                        )}
                        {requestData.hr_signature && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <img
                              src={requestData.hr_signature}
                              alt="HR signature"
                              className="h-16 w-full object-contain"
                            />
                          </div>
                        )}
                        {requestData.hr_comments && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">Comments:</p>
                            <p className="text-xs text-slate-700">{requestData.hr_comments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {requestData.vp_approved_at && (
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">VP Approved</p>
                          <span className="text-xs text-green-600 font-medium">
                            {new Date(requestData.vp_approved_at).toLocaleString('en-US', { 
                              timeZone: 'Asia/Manila',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        {requestData.vp_approved_by && (
                          <p className="text-xs text-slate-600">
                            By: {requestData.vp_approver?.name || "Vice President"}
                          </p>
                        )}
                        {requestData.vp_signature && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <img
                              src={requestData.vp_signature}
                              alt="VP signature"
                              className="h-16 w-full object-contain"
                            />
                          </div>
                        )}
                        {requestData.vp_comments && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">Comments:</p>
                            <p className="text-xs text-slate-700">{requestData.vp_comments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {requestData.president_approved_at && (
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-900">President Approved</p>
                          <span className="text-xs text-green-600 font-medium">
                            {new Date(requestData.president_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        {requestData.president_approved_by && (
                          <p className="text-xs text-slate-600">
                            By: {requestData.president_approver?.name || "President"}
                          </p>
                        )}
                        {requestData.president_signature && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <img
                              src={requestData.president_signature}
                              alt="President signature"
                              className="h-16 w-full object-contain"
                            />
                          </div>
                        )}
                        {requestData.president_comments && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">Comments:</p>
                            <p className="text-xs text-slate-700">{requestData.president_comments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!requestData.head_approved_at && !requestData.hr_approved_at && !requestData.vp_approved_at && !requestData.president_approved_at && (
                      <div className="text-center py-4 text-sm text-slate-500">
                        No previous approvals yet
                      </div>
                    )}
                  </div>
                </section>

                {/* Budget Breakdown */}
                <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                    <DollarSign className="h-5 w-5 text-slate-700" />
                    <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
                  </div>

                  {expenseBreakdown.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-3">
                        {expenseBreakdown.map((expense: any, idx: number) => {
                          const label = expense.item === "Other" && expense.description 
                            ? expense.description 
                            : expense.item || expense.description;
                          
                          return expense.amount > 0 && (
                            <div key={idx} className="flex items-center justify-between py-2">
                              <span className="text-sm text-slate-600">{label}</span>
                              <span className="text-sm font-semibold text-slate-900">{peso(expense.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {totalBudget > 0 && (
                        <div className="pt-3 border-t border-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                            <span className="text-lg font-bold text-[#7A0010]">{peso(totalBudget)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-slate-500">No budget specified</p>
                    </div>
                  )}
                </section>

                {/* Cost Justification */}
                {requestData.cost_justification && (
                  <section className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
                    <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4" />
                      Cost Justification
                    </h3>
                    <div className="bg-white rounded-md border border-amber-200 p-3 text-sm text-gray-800 leading-relaxed shadow-sm">
                      {requestData.cost_justification}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT */}
              <div className="space-y-5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-lg">
                {/* Signature Section */}
                {!requestData.requester_signature ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-[#7A0010] uppercase tracking-wide mb-1">
                        Your Signature <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        Please sign to approve this request. After signing, it will be forwarded to your department head.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                      <SignaturePad
                        height={160}
                        value={signature || null}
                        onSave={(dataUrl) => setSignature(dataUrl)}
                        onClear={() => setSignature("")}
                        onUseSaved={(dataUrl) => setSignature(dataUrl)}
                        showUseSavedButton={true}
                        hideSaveButton
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-[#7A0010] uppercase tracking-wide mb-1">
                        Your Signature
                      </h3>
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        Already Signed
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border-2 border-slate-200">
                      <img 
                        src={requestData.requester_signature} 
                        alt="Requester Signature" 
                        className="max-h-40 mx-auto"
                      />
                      {requestData.requester_signed_at && (
                        <p className="text-xs text-slate-500 text-center mt-2">
                          Signed on {new Date(requestData.requester_signed_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Request History */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-slate-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Request History</h3>
                    {loadingDetails && (
                      <span className="text-xs text-slate-500 ml-auto">Loading...</span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.length > 0 ? (
                      history.map((entry, idx) => (
                        <div key={entry.id || idx} className="flex items-start gap-2 bg-white rounded p-2 border border-slate-200">
                          <div className="mt-0.5">
                            {entry.action === "requester_signed" || entry.action === "approved" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            ) : entry.action === "rejected" ? (
                              <X className="h-3.5 w-3.5 text-red-600" />
                            ) : entry.action === "created" ? (
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 capitalize">
                              {entry.action.replace(/_/g, " ")}
                            </p>
                            {entry.actor && (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                by {entry.actor.name || entry.actor.email}
                              </p>
                            )}
                            {entry.comments && (
                              <p className="text-[10px] text-slate-700 mt-1 italic">"{entry.comments}"</p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-1">
                              {formatDateTime(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-500">
                        No history available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!requestData.requester_signature && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSignClick}
              disabled={submitting || !signature || loadingDetails}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Sign & Forward
                </>
              )}
            </button>
          </div>
        )}
        {requestData.requester_signature && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Sign Confirmation Dialog */}
      <SignConfirmationDialog
        open={showConfirmDialog}
        requestId={request.id}
        onConfirm={handleSign}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
