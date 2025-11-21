"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Banknote, 
  Users, 
  User,
  Car, 
  FileText, 
  Printer, 
  ExternalLink,
  Building2,
  Clock,
  Route,
  CheckCircle2,
  PenTool,
  Download,
  FileDown,
  Upload
} from 'lucide-react';
import { WowCard, WowButton } from './Modal';
import ProfilePicture, { PersonDisplay } from './ProfilePicture';
import { NameWithProfile } from './ProfileHoverCard';
import SignatureStageRail from './SignatureStageRail';
import RequestStatusTracker from './RequestStatusTracker';
import { formatLongDate, formatLongDateTime } from '@/lib/datetime';
import FileAttachmentSection from '@/components/user/request/ui/parts/FileAttachmentSection.view';

export interface RequestData {
  id: string;
  request_number: string;
  file_code?: string; // Log book file code
  title: string;
  purpose: string;
  destination: string;
  destination_geo?: { lat: number; lng: number; address?: string } | null;
  vehicle_mode?: 'institutional' | 'owned' | 'rent';
  preferred_driver_name?: string;
  preferred_vehicle_name?: string;
  travel_start_date: string;
  travel_end_date: string;
  total_budget: number;
  created_at?: string;
  expense_breakdown?: Array<{
    category: string;
    amount: number;
    description?: string;
  }>;
  transportation_type?: 'pickup' | 'self';
  pickup_preference?: 'pickup' | 'self' | 'gymnasium';
  pickup_location?: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
  pickup_time?: string;
  pickup_contact_number?: string;
  requester_contact_number?: string;
  pickup_special_instructions?: string;
  return_transportation_same?: boolean;
  dropoff_location?: string;
  dropoff_time?: string;
  parking_required?: boolean;
  own_vehicle_details?: string;
  cost_justification?: string;
  preferred_vehicle?: string;
  preferred_driver?: string;
  preferred_driver_id?: string | null;
  preferred_vehicle_id?: string | null;
  preferred_vehicle_note?: string;
  preferred_driver_note?: string;
  assigned_driver_id?: string | null;
  assigned_vehicle_id?: string | null;
  assigned_driver?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profile_picture?: string;
  } | null;
  assigned_vehicle?: {
    id: string;
    name: string;
    plate_number?: string;
    type?: string;
    capacity?: number;
  } | null;
  assigned_driver_name?: string;
  assigned_vehicle_name?: string;
  driver_contact_number?: string;
  status: string;
  
  requester: {
    id: string;
    name: string;
    profile_picture?: string;
    department?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  
  requester_signature?: string | null;
  
  department: {
    id: string;
    name: string;
    code?: string;
  };
  
  participants?: Array<{
    id: string;
    name: string;
    profile_picture?: string;
    department?: string;
    position?: string;
  }>;
  
  signatures: any[]; // Will be typed properly based on SignatureStageRail
  timeline: any[]; // Will be typed properly based on TrackingTimeline
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    mime: string;
    size: number;
    uploaded_at?: string;
  }>;
  seminar_code_per_person?: Array<{
    person_id?: string;
    name: string;
    code: string;
  }>;
  
  // Smart workflow fields
  smart_skips_applied?: string[];
  efficiency_boost?: number;
  requires_budget?: boolean;
  
  // Workflow metadata
  workflow_metadata?: {
    next_vp_id?: string;
    next_admin_id?: string;
    next_approver_role?: string;
    reason_of_trip?: string;
    department_head_endorsed_by?: string;
    department_head_endorsement_date?: string;
    [key: string]: any;
  };
  
  // Status tracking fields for RequestStatusTracker
  requesterIsHead?: boolean;
  hasBudget?: boolean;
  hasParentHead?: boolean;
  requiresPresidentApproval?: boolean;
  headApprovedAt?: string | null;
  headApprovedBy?: string | null;
  head_approved_by?: string | null;
  head_approver?: {
    id: string;
    name: string;
    profile_picture?: string;
    department?: string;
    position?: string;
    email?: string;
  } | null;
  parentHeadApprovedAt?: string | null;
  parentHeadApprovedBy?: string | null;
  adminProcessedAt?: string | null;
  adminProcessedBy?: string | null;
  comptrollerApprovedAt?: string | null;
  comptrollerApprovedBy?: string | null;
  hrApprovedAt?: string | null;
  hrApprovedBy?: string | null;
  vpApprovedAt?: string | null;
  vpApprovedBy?: string | null;
  vp2ApprovedAt?: string | null;
  vp2ApprovedBy?: string | null;
  bothVpsApproved?: boolean;
  presidentApprovedAt?: string | null;
  presidentApprovedBy?: string | null;
  execApprovedAt?: string | null;
  execApprovedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionStage?: string | null;
  
  // Seminar application fields
  request_type?: 'seminar' | 'travel_order';
  seminar_data?: {
    applicationDate?: string;
    title?: string;
    dateFrom?: string;
    dateTo?: string;
    typeOfTraining?: string[];
    trainingCategory?: string;
    sponsor?: string;
    venue?: string;
    venueGeo?: any;
    modality?: string;
    registrationCost?: number | null;
    totalAmount?: number | null;
    breakdown?: Array<{ label: string; amount: number | null; description?: string }>;
    makeUpClassSchedule?: string;
    applicantUndertaking?: boolean;
    fundReleaseLine?: number | null;
    requesterSignature?: string | null;
    applicants?: Array<{ name: string; department: string; availableFdp?: number | null; signature?: string | null; email?: string; invitationId?: string }>;
    participantInvitations?: any[];
    allParticipantsConfirmed?: boolean;
  };
}

interface RequestDetailsViewProps {
  request: RequestData;
  canApprove?: boolean;
  canReturn?: boolean;
  canEdit?: boolean;
  onApprove?: () => void;
  onReturn?: () => void;
  onEdit?: () => void;
  onPrint?: () => void;
  onClose?: () => void;
  className?: string;
}

export default function RequestDetailsView({
  request,
  canApprove = false,
  canReturn = false,
  canEdit = false,
  onApprove,
  onReturn,
  onEdit,
  onPrint,
  onClose,
  className = ''
}: RequestDetailsViewProps) {
  const [confirmedRequesters, setConfirmedRequesters] = useState<any[]>([]);
  const [loadingRequesters, setLoadingRequesters] = useState(false);
  const [routingPerson, setRoutingPerson] = useState<{ name: string; role: string; position?: string } | null>(null);
  const [loadingRoutingPerson, setLoadingRoutingPerson] = useState(false);
  const [editingAttachments, setEditingAttachments] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<any[]>(request.attachments || []);

  // Fetch confirmed requesters
  useEffect(() => {
    if (request?.id) {
      fetchConfirmedRequesters();
    }
  }, [request?.id]);

  // Fetch routing person (who the request was sent to)
  useEffect(() => {
    console.log('[RequestDetailsView] 🔄 useEffect triggered for routing person:', {
      hasWorkflowMetadata: !!request?.workflow_metadata,
      workflowMetadata: request?.workflow_metadata,
      status: request?.status
    });
    if (request?.workflow_metadata) {
      fetchRoutingPerson();
    } else {
      console.log('[RequestDetailsView] ⚠️ No workflow_metadata found in request');
      setRoutingPerson(null);
    }
  }, [request?.workflow_metadata, request?.status]);

  const fetchRoutingPerson = async () => {
    try {
      setLoadingRoutingPerson(true);
      const workflowMetadata = request.workflow_metadata || {};
      const nextVpId = workflowMetadata?.next_vp_id;
      const nextAdminId = workflowMetadata?.next_admin_id;
      const nextApproverRole = workflowMetadata?.next_approver_role;

      console.log('[RequestDetailsView] 🔍 Fetching routing person:', {
        workflowMetadata,
        nextVpId,
        nextAdminId,
        nextApproverRole,
        status: request.status
      });

      // If request was sent to a specific VP
      // Check for pending_exec OR pending_head (when head selected VP during submission)
      if (nextVpId && (request.status === 'pending_exec' || request.status === 'pending_head' || nextApproverRole === 'vp')) {
        console.log('[RequestDetailsView] 📞 Fetching VP user:', nextVpId);
        const response = await fetch(`/api/users/${nextVpId}`);
        const data = await response.json();
        if (data.ok && data.data) {
          console.log('[RequestDetailsView] ✅ Found VP:', data.data.name);
          setRoutingPerson({
            name: data.data.name || 'Unknown VP',
            role: 'Vice President',
            position: data.data.position_title || 'VP'
          });
          return;
        } else {
          console.error('[RequestDetailsView] ❌ Failed to fetch VP:', data.error);
        }
      }

      // If request was sent to a specific Admin
      // Check for pending_admin OR pending_head (when head selected Admin during submission)
      // Also check if nextApproverRole is admin (even if status is still pending_head in multi-dept cases)
      if (nextAdminId && (request.status === 'pending_admin' || request.status === 'pending_head' || nextApproverRole === 'admin')) {
        console.log('[RequestDetailsView] 📞 Fetching Admin user:', nextAdminId, 'status:', request.status, 'nextApproverRole:', nextApproverRole);
        const response = await fetch(`/api/users/${nextAdminId}`);
        const data = await response.json();
        if (data.ok && data.data) {
          console.log('[RequestDetailsView] ✅ Found Admin:', data.data.name);
          setRoutingPerson({
            name: data.data.name || 'Unknown Admin',
            role: 'Administrator',
            position: data.data.position_title || 'Admin'
          });
          return;
        } else {
          console.error('[RequestDetailsView] ❌ Failed to fetch Admin:', data.error);
        }
      }
      
      // Also check if status is pending_head but head already sent to admin (check request_history)
      if (request.status === 'pending_head' && !nextAdminId && !nextVpId) {
        try {
          const historyResponse = await fetch(`/api/requests/${request.id}/history`);
          const historyData = await historyResponse.json();
          if (historyData.ok && historyData.data) {
            // API returns { ok: true, data: { request, history } }
            const history = Array.isArray(historyData.data.history) 
              ? historyData.data.history 
              : (Array.isArray(historyData.data) ? historyData.data : []);
            
            if (history.length > 0) {
              // Find the most recent head approval that sent to admin
              const headApproval = history
                .filter((h: any) => h.action === 'approved' && h.actor_role === 'head')
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              
              if (headApproval?.metadata?.sent_to_id && headApproval.metadata.sent_to === 'admin') {
                console.log('[RequestDetailsView] 📞 Found sent_to_id from history (pending_head case):', headApproval.metadata.sent_to_id);
                const userResponse = await fetch(`/api/users/${headApproval.metadata.sent_to_id}`);
                const userData = await userResponse.json();
                if (userData.ok && userData.data) {
                  console.log('[RequestDetailsView] ✅ Found Admin from history (pending_head):', userData.data.name);
                  setRoutingPerson({
                    name: userData.data.name || 'Unknown Admin',
                    role: 'Administrator',
                    position: userData.data.position_title || 'Admin'
                  });
                  return;
                }
              }
            }
          }
        } catch (err) {
          console.error('[RequestDetailsView] Error fetching from history (pending_head):', err);
        }
      }
      
      // Fallback: Check request_history for sent_to_id if workflow_metadata doesn't have it
      // This handles cases where head sent to admin but next_admin_id wasn't stored
      if (request.status === 'pending_admin' && !nextAdminId) {
        try {
          const historyResponse = await fetch(`/api/requests/${request.id}/history`);
          const historyData = await historyResponse.json();
          if (historyData.ok && historyData.data) {
            // API returns { ok: true, data: { request, history } }
            const history = Array.isArray(historyData.data.history) 
              ? historyData.data.history 
              : (Array.isArray(historyData.data) ? historyData.data : []);
            
            if (history.length > 0) {
              // Find the most recent head approval that sent to admin
              const headApproval = history
                .filter((h: any) => h.action === 'approved' && h.actor_role === 'head')
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              
              if (headApproval?.metadata?.sent_to_id && headApproval.metadata.sent_to === 'admin') {
                console.log('[RequestDetailsView] 📞 Found sent_to_id from history:', headApproval.metadata.sent_to_id);
                const userResponse = await fetch(`/api/users/${headApproval.metadata.sent_to_id}`);
                const userData = await userResponse.json();
                if (userData.ok && userData.data) {
                  console.log('[RequestDetailsView] ✅ Found Admin from history:', userData.data.name);
                  setRoutingPerson({
                    name: userData.data.name || 'Unknown Admin',
                    role: 'Administrator',
                    position: userData.data.position_title || 'Admin'
                  });
                  return;
                }
              }
            }
          }
        } catch (err) {
          console.error('[RequestDetailsView] Error fetching from history:', err);
        }
      }
      
      // No routing person found
      console.log('[RequestDetailsView] ⚠️ No routing person found - clearing state');
      setRoutingPerson(null);
    } catch (err) {
      console.error('[RequestDetailsView] Error fetching routing person:', err);
      setRoutingPerson(null);
    } finally {
      setLoadingRoutingPerson(false);
    }
  };

  const fetchConfirmedRequesters = async () => {
    try {
      setLoadingRequesters(true);
      console.log('[RequestDetailsView] 🔍 Fetching confirmed requesters for request:', request.id);
      const response = await fetch(`/api/requesters/status?request_id=${request.id}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();
      
      console.log('[RequestDetailsView] 📊 Requester status response:', {
        ok: data.ok,
        count: data.data?.length || 0,
        data: data.data
      });
      
      if (data.ok && data.data) {
        console.log('[RequestDetailsView] 📋 All invitations received for request:', request.id, {
          totalInvitations: data.data.length,
          invitations: data.data.map((r: any) => ({
            email: r.email,
            name: r.name,
            status: r.status,
            hasSignature: !!r.signature,
            confirmed_at: r.confirmed_at
          }))
        });
        
        // Include ALL confirmed requesters
        // Note: We include ALL confirmed requesters, even if they're the main requester
        // The UI will handle displaying them appropriately
        const confirmed = data.data.filter((req: any) => {
          // Only include if status is confirmed
          if (req.status !== 'confirmed') {
            console.log('[RequestDetailsView] ⏭️ Skipping requester (not confirmed):', {
              email: req.email,
              name: req.name,
              status: req.status
            });
            return false;
          }
          
          console.log('[RequestDetailsView] ✅ Including confirmed requester:', {
            name: req.name || req.email,
            email: req.email,
            hasSignature: !!req.signature,
            confirmed_at: req.confirmed_at,
            requestId: request.id
          });
          return true;
        });
        
        // Log detailed info for debugging
        console.log('[RequestDetailsView] 🔍 Detailed confirmed requesters check:', {
          totalInvitations: data.data.length,
          confirmedCount: confirmed.length,
          mainRequesterEmail: request.requester?.email,
          mainRequesterId: request.requester?.id,
          confirmedEmails: confirmed.map((r: any) => r.email),
          confirmedNames: confirmed.map((r: any) => r.name),
          allInvitationEmails: data.data.map((r: any) => ({ email: r.email, status: r.status }))
        });
        
        console.log('[RequestDetailsView] ✅ Final confirmed requesters:', {
          count: confirmed.length,
          requesters: confirmed.map((r: any) => ({
            name: r.name || r.email,
            email: r.email,
            hasSignature: !!r.signature
          })),
          note: confirmed.length === 0 ? 'No confirmed requesters found. If you expected someone to appear, check if they were invited and confirmed for this request.' : ''
        });
        setConfirmedRequesters(confirmed);
      } else {
        console.error('[RequestDetailsView] ❌ Failed to fetch requesters:', data.error);
        setConfirmedRequesters([]);
      }
    } catch (err) {
      console.error('[RequestDetailsView] Error fetching confirmed requesters:', err);
      setConfirmedRequesters([]);
    } finally {
      setLoadingRequesters(false);
    }
  };

  const handleEditAttachments = () => {
    setEditingAttachments(true);
    setCurrentAttachments(request.attachments || []);
  };

  const handleSaveAttachments = async () => {
    try {
      setUploadingAttachments(true);
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: currentAttachments
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update attachments');
      }

      // Update local state
      request.attachments = currentAttachments;
      setEditingAttachments(false);
      
      // Show success message
      alert('Attachments updated successfully!');
      
      // Reload page to show updated attachments
      window.location.reload();
    } catch (error: any) {
      console.error('[RequestDetailsView] Error updating attachments:', error);
      alert(`Failed to update attachments: ${error.message}`);
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleCancelEditAttachments = () => {
    setEditingAttachments(false);
    setCurrentAttachments(request.attachments || []);
  };

  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('timeline');
  
  // Function to open Google Maps
  const openGoogleMaps = () => {
    const location = request.seminar_data?.venue || request.destination;
    const geo = request.seminar_data?.venueGeo || request.destination_geo;
    
    let mapsUrl = '';
    
    if (geo && geo.lat && geo.lng) {
      // Use coordinates if available
      mapsUrl = `https://www.google.com/maps?q=${geo.lat},${geo.lng}`;
    } else if (location) {
      // Use address/venue name as search query
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    } else {
      return; // No location data available
    }
    
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Debug vehicle/driver data
  console.log('[RequestDetailsView] 🔍 DEBUG - Driver/Vehicle Data:', {
    preferred_driver_id: request.preferred_driver_id,
    preferred_driver_name: request.preferred_driver_name,
    preferred_driver: request.preferred_driver,
    preferred_vehicle_id: request.preferred_vehicle_id,
    preferred_vehicle_name: request.preferred_vehicle_name,
    preferred_vehicle: request.preferred_vehicle,
    cost_justification: request.cost_justification,
    hasCostJustification: !!request.cost_justification,
    costJustificationLength: request.cost_justification?.length || 0
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Handle different date formats
      let date: Date;
      
      // If it's already a valid ISO string or timestamp, use it directly
      if (dateString.includes('T') || dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
        date = new Date(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - add timezone
        date = new Date(dateString + 'T00:00:00+08:00');
      } else {
        // Try parsing as-is
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[RequestDetailsView] Invalid date:', dateString);
        return '—';
      }
      
      return formatLongDate(date.toISOString());
    } catch (e) {
      console.warn('[RequestDetailsView] Date formatting error:', e, dateString);
      return '—';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_head': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_admin': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_comptroller': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_hr': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_exec': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_requester_signature': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'returned': 'bg-red-100 text-red-800 border-red-200',
      'dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'draft': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatStatus = (status: string) => {
    // Convert status to human-readable format
    const statusMap: Record<string, string> = {
      'pending_head': 'Pending Head',
      'pending_admin': 'Pending Admin',
      'pending_comptroller': 'Pending Comptroller',
      'pending_hr': 'Pending HR',
      'pending_exec': 'Pending Executive',
      'pending_requester_signature': 'Pending Signature',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled',
      'draft': 'Draft',
      'dispatched': 'Dispatched',
      'completed': 'Completed',
      'returned': 'Returned'
    };
    
    return statusMap[status.toLowerCase()] || status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const hasSmartFeatures = request.smart_skips_applied && request.smart_skips_applied.length > 0;

  return (
    <div className={`max-w-6xl mx-auto space-y-6 p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#7a0019] via-[#6a0015] to-[#5a0012] text-white rounded-2xl p-8 shadow-2xl border-2 border-white/10"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight">{request.request_number}</h1>
                {request.file_code && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-xs font-medium text-blue-600">File Code:</span>
                    <span className="text-sm font-mono font-semibold text-blue-900">{request.file_code}</span>
                  </div>
                )}
              </div>
              {/* Request Type Indicator */}
              {request.request_type === 'seminar' ? (
                <div className="bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border border-white/30">
                  <FileText className="w-3.5 h-3.5" />
                  Seminar Application
                </div>
              ) : (
                <div className="bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border border-white/30">
                  <Route className="w-3.5 h-3.5" />
                  Travel Order
                </div>
              )}
              {hasSmartFeatures && (
                <div className="bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border border-white/30">
                  <span className="w-2.5 h-2.5 bg-blue-300 rounded-full animate-pulse"></span>
                  Smart Skip Active
                </div>
              )}
            </div>
            <p className="text-white/95 text-xl font-semibold mb-5 leading-relaxed">{request.title}</p>
            <div className="flex items-center gap-8 text-sm text-white/90">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {formatDate(request.travel_start_date)}
                  {request.travel_start_date !== request.travel_end_date && 
                    ` - ${formatDate(request.travel_end_date)}`
                  }
                </span>
              </div>
              <button
                onClick={openGoogleMaps}
                className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                title="View location on Google Maps"
              >
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{request.seminar_data?.venue || request.destination}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`
              px-5 py-2.5 rounded-full text-sm font-bold border-2 shadow-lg
              ${getStatusColor(request.status)}
            `}>
              {formatStatus(request.status)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons for Approvers */}
      {(canApprove || canReturn || canEdit) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          {canApprove && (
            <WowButton variant="primary" onClick={onApprove}>
              <FileText className="w-4 h-4" />
              Approve Request
            </WowButton>
          )}
          {canReturn && (
            <WowButton variant="danger" onClick={onReturn}>
              Return for Changes
            </WowButton>
          )}
          {canEdit && (
            <WowButton variant="outline" onClick={onEdit}>
              Edit Details
            </WowButton>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <WowCard>
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'details', label: 'Details', icon: FileText },
                  { id: 'timeline', label: 'Timeline', icon: Clock }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === id
                        ? 'border-[#7a0019] text-[#7a0019]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Basic Information - Combined */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      {/* Reason of Trip */}
                      {request.workflow_metadata?.reason_of_trip && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Reason of Trip</p>
                          <p className="text-gray-900 font-medium capitalize">
                            {request.workflow_metadata.reason_of_trip.replace('_', ' ')}
                          </p>
                        </div>
                      )}
                      
                      {/* Purpose */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Purpose</p>
                        <p className="text-gray-900">{request.purpose}</p>
                      </div>

                      {/* Destination/Venue */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Destination</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-medium">{request.seminar_data?.venue || request.destination}</p>
                          <button
                            onClick={openGoogleMaps}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                            title="View on Google Maps"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            View on Map
                          </button>
                        </div>
                      </div>

                      {/* Grid for other info */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Department</p>
                          <p className="text-gray-900 font-medium">{request.department.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Travel Dates</p>
                          <p className="text-gray-900 font-medium">
                            {formatDate(request.travel_start_date)}
                            {request.travel_start_date !== request.travel_end_date && 
                              ` - ${formatDate(request.travel_end_date)}`
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Date Requested</p>
                          <p className="text-gray-900 font-medium">{formatDate(request.created_at || request.travel_start_date)}</p>
                        </div>
                        {request.total_budget > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Budget</p>
                            <p className="text-gray-900 font-medium">{formatCurrency(request.total_budget)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Department Head Endorsement */}
                  {request.workflow_metadata?.department_head_endorsed_by && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Head Endorsement</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Endorsed By</p>
                          <p className="text-gray-900 font-medium">{request.workflow_metadata.department_head_endorsed_by}</p>
                        </div>
                        {request.workflow_metadata.department_head_endorsement_date && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Endorsement Date</p>
                            <p className="text-gray-900 font-medium">
                              {formatDate(request.workflow_metadata.department_head_endorsement_date)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Budget Breakdown - Show expense breakdown if available */}
                  {request.expense_breakdown && Array.isArray(request.expense_breakdown) && request.expense_breakdown.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>
                      <div className="space-y-2 mb-3">
                        {request.expense_breakdown.map((expense: any, idx: number) => {
                          // Use same logic as VP modal for label
                          const label = expense.item === "Other" && expense.description 
                            ? expense.description 
                            : expense.item || expense.description || expense.category || "Unknown";
                          
                          // Show items with amount > 0
                          if (!expense.amount || expense.amount <= 0) return null;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <span className="text-sm text-gray-600 font-medium">{label}</span>
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {request.total_budget > 0 && (
                        <div className="pt-3 border-t-2 border-gray-300">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">TOTAL BUDGET</span>
                            <span className="text-lg font-bold text-[#7a0019]">{formatCurrency(request.total_budget)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget Justification */}
                  {(request.cost_justification && request.cost_justification.trim() !== '') && (
                    <WowCard className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                      <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-700" />
                        Budget Justification
                      </h3>
                      <div className="bg-white rounded-md border border-amber-200 p-4 text-sm text-gray-800 leading-relaxed shadow-sm">
                        <p className="whitespace-pre-wrap">{request.cost_justification}</p>
                      </div>
                    </WowCard>
                  )}

                  {/* Vehicle Mode */}
                  {request.vehicle_mode && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#7a0019]" />
                        Vehicle Mode
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Vehicle Type</p>
                          <p className="text-gray-900 font-medium capitalize">
                            {request.vehicle_mode === 'institutional' 
                              ? 'Institutional Vehicle' 
                              : request.vehicle_mode === 'owned'
                              ? 'Owned Vehicle'
                              : request.vehicle_mode === 'rent'
                              ? 'Rent (External)'
                              : request.vehicle_mode
                            }
                          </p>
                        </div>
                        
                        {/* Preferred Driver */}
                        {(request.preferred_driver_name || request.preferred_driver) && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Preferred Driver (Suggestion)</p>
                            <p className="text-gray-900 font-medium">{request.preferred_driver_name || request.preferred_driver}</p>
                            {request.preferred_driver_note && (
                              <p className="text-xs text-gray-500 mt-1">{request.preferred_driver_note}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Preferred Vehicle */}
                        {(request.preferred_vehicle_name || request.preferred_vehicle) && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Preferred Vehicle (Suggestion)</p>
                            <p className="text-gray-900 font-medium">{request.preferred_vehicle_name || request.preferred_vehicle}</p>
                            {request.preferred_vehicle_note && (
                              <p className="text-xs text-gray-500 mt-1">{request.preferred_vehicle_note}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Driver and Vehicle (Admin Assignment) */}
                  {(request.assigned_driver || request.assigned_vehicle) && (
                    <WowCard className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        Assigned Driver & Vehicle
                      </h3>
                      <div className="space-y-4">
                        {/* Assigned Driver */}
                        {request.assigned_driver && (
                          <div className="p-4 bg-white rounded-lg border border-green-200">
                            <div className="flex items-start gap-3">
                              {request.assigned_driver.profile_picture && (
                                <ProfilePicture
                                  src={request.assigned_driver.profile_picture}
                                  name={request.assigned_driver.name}
                                  size="md"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 mb-1">Assigned Driver</p>
                                <p className="text-base font-bold text-gray-900">{request.assigned_driver.name}</p>
                                {request.assigned_driver.email && (
                                  <p className="text-sm text-gray-600 mt-1">{request.assigned_driver.email}</p>
                                )}
                                {request.assigned_driver.phone && (
                                  <p className="text-sm text-gray-600">{request.assigned_driver.phone}</p>
                                )}
                                {request.driver_contact_number && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Contact:</span> {request.driver_contact_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Assigned Vehicle */}
                        {request.assigned_vehicle && (
                          <div className="p-4 bg-white rounded-lg border border-green-200">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Car className="w-5 h-5 text-gray-700" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 mb-1">Assigned Vehicle</p>
                                <p className="text-base font-bold text-gray-900">
                                  {request.assigned_vehicle.name}
                                  {request.assigned_vehicle.plate_number && (
                                    <span className="text-sm font-normal text-gray-600 ml-2">
                                      • {request.assigned_vehicle.plate_number}
                                    </span>
                                  )}
                                </p>
                                {request.assigned_vehicle.type && (
                                  <p className="text-sm text-gray-600 mt-1 capitalize">
                                    Type: {request.assigned_vehicle.type}
                                  </p>
                                )}
                                {request.assigned_vehicle.capacity && (
                                  <p className="text-sm text-gray-600">
                                    Capacity: {request.assigned_vehicle.capacity} passengers
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </WowCard>
                  )}

                  {/* Transportation Details */}
                  {request.transportation_type && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#7a0019]" />
                        Transportation Arrangement
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Transportation Type</p>
                          <p className="text-gray-900 font-medium">
                            {request.transportation_type === 'pickup' 
                              ? 'University Vehicle (Pick-up Service)' 
                              : 'Own Transportation'
                            }
                          </p>
                        </div>

                        {/* Pickup Preference */}
                        {request.pickup_preference && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Pickup Preference</p>
                            <p className="text-gray-900 font-medium">
                              {request.pickup_preference === 'pickup' 
                                ? 'Pickup at Location' 
                                : request.pickup_preference === 'gymnasium'
                                ? 'Pickup at Gymnasium'
                                : 'Self-Transport'
                              }
                            </p>
                          </div>
                        )}

                        {/* Requester Contact Number */}
                        {request.requester_contact_number && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Requester Contact Number</p>
                            <p className="text-gray-900 font-medium">{request.requester_contact_number}</p>
                            <p className="text-xs text-gray-500 mt-1">For driver coordination</p>
                          </div>
                        )}

                        {request.transportation_type === 'pickup' && (
                          <>
                            {request.pickup_location && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Pick-up Location</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900">{request.pickup_location}</p>
                                  {(request.pickup_location_lat && request.pickup_location_lng) && (
                                    <button
                                      onClick={() => {
                                        const url = `https://www.google.com/maps?q=${request.pickup_location_lat},${request.pickup_location_lng}`;
                                        window.open(url, '_blank');
                                      }}
                                      className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                                      title="View on Google Maps"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      Map
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {request.pickup_time && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Pick-up Time</p>
                                <p className="text-gray-900">{request.pickup_time}</p>
                              </div>
                            )}

                            {request.pickup_contact_number && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Contact Number</p>
                                <p className="text-gray-900">{request.pickup_contact_number}</p>
                              </div>
                            )}

                            {request.pickup_special_instructions && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Special Instructions</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{request.pickup_special_instructions}</p>
                              </div>
                            )}

                            {request.return_transportation_same !== undefined && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Return Transportation</p>
                                <p className="text-gray-900">
                                  {request.return_transportation_same 
                                    ? 'Same as pick-up location' 
                                    : 'Different location'
                                  }
                                </p>
                              </div>
                            )}

                            {!request.return_transportation_same && request.dropoff_location && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Drop-off Location</p>
                                <p className="text-gray-900">{request.dropoff_location}</p>
                              </div>
                            )}

                            {!request.return_transportation_same && request.dropoff_time && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Drop-off Time</p>
                                <p className="text-gray-900">{request.dropoff_time}</p>
                              </div>
                            )}

                            {request.parking_required && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Parking Required</p>
                                <p className="text-gray-900">Yes</p>
                              </div>
                            )}
                          </>
                        )}

                        {request.transportation_type === 'self' && request.own_vehicle_details && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Vehicle Details</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{request.own_vehicle_details}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Seminar Application Details */}
                  {(() => {
                    const isSeminar = request.request_type === 'seminar';
                    const hasSeminarData = !!request.seminar_data;
                    console.log('[RequestDetailsView] Seminar check:', {
                      request_type: request.request_type,
                      isSeminar,
                      hasSeminarData,
                      seminar_data: request.seminar_data ? 'EXISTS' : 'MISSING'
                    });
                    return isSeminar && hasSeminarData;
                  })() && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Seminar Application Details</h3>
                      <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Application Date</p>
                              <p className="text-gray-900">{request.seminar_data?.applicationDate ? formatDate(request.seminar_data.applicationDate) : '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Training Category</p>
                              <p className="text-gray-900 capitalize">{request.seminar_data?.trainingCategory || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Modality</p>
                              <p className="text-gray-900">{request.seminar_data?.modality || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Sponsor / Partner</p>
                              <p className="text-gray-900">{request.seminar_data?.sponsor || '—'}</p>
                            </div>
                            {request.seminar_data?.dateFrom && request.seminar_data?.dateTo && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Duration</p>
                                <p className="text-gray-900">
                                  {(() => {
                                    const start = new Date(request.seminar_data.dateFrom);
                                    const end = new Date(request.seminar_data.dateTo);
                                    const diffTime = Math.abs(end.getTime() - start.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
                                  })()}
                                </p>
                              </div>
                            )}
                            {request.seminar_data?.venue && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Venue</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900">{request.seminar_data.venue}</p>
                                  <button
                                    onClick={openGoogleMaps}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                                    title="View on Google Maps"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    Map
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Type of Training */}
                        {request.seminar_data?.typeOfTraining && request.seminar_data.typeOfTraining.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Type of Training</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.seminar_data.typeOfTraining.map((type: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Applicants */}
                        {request.seminar_data?.applicants && request.seminar_data.applicants.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Applicants ({request.seminar_data.applicants.length})
                            </h4>
                            <div className="space-y-3">
                              {request.seminar_data.applicants.map((applicant: any, idx: number) => (
                                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 mb-1">{applicant.name || '—'}</p>
                                      <p className="text-sm text-gray-600 mb-2">{applicant.department || '—'}</p>
                                      {applicant.availableFdp !== null && applicant.availableFdp !== undefined && (
                                        <p className="text-xs text-gray-500">FDP: {applicant.availableFdp}</p>
                                      )}
                                    </div>
                                    {applicant.signature && (
                                      <img 
                                        src={applicant.signature} 
                                        alt={`${applicant.name}'s signature`}
                                        className="h-12 w-32 rounded border border-gray-300 bg-white object-contain"
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expense Breakdown */}
                        {request.seminar_data?.breakdown && request.seminar_data.breakdown.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h4>
                            <div className="space-y-3">
                              {request.seminar_data.breakdown.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                                  <div className="flex justify-between items-start gap-4 mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{item.label || 'Unnamed Expense'}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                      )}
                                    </div>
                                    <p className="text-gray-900 font-semibold">
                                      {item.amount ? formatCurrency(item.amount) : '₱0.00'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                              {request.seminar_data?.registrationCost && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Registration Cost:</span>
                                  <span className="text-gray-900 font-medium">{formatCurrency(request.seminar_data.registrationCost)}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total Amount:</span>
                                <span className="text-[#7a0019] font-bold text-lg">
                                  {(() => {
                                    const breakdownTotal = request.seminar_data?.breakdown?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
                                    const registrationCost = request.seminar_data?.registrationCost || 0;
                                    const calculatedTotal = breakdownTotal + registrationCost;
                                    if (calculatedTotal > 0) {
                                      return formatCurrency(calculatedTotal);
                                    } else if (request.seminar_data?.totalAmount) {
                                      return formatCurrency(request.seminar_data.totalAmount);
                                    } else {
                                      return '₱0.00';
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        {(request.seminar_data?.makeUpClassSchedule || request.seminar_data?.fundReleaseLine !== null || request.seminar_data?.applicantUndertaking) && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                            <div className="space-y-4">
                              {request.seminar_data?.makeUpClassSchedule && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Make-up Class Schedule</p>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.seminar_data.makeUpClassSchedule}</p>
                                </div>
                              )}
                              {request.seminar_data?.fundReleaseLine !== null && request.seminar_data?.fundReleaseLine !== undefined && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Fund Release Line</p>
                                  <p className="text-gray-900 font-semibold">{formatCurrency(request.seminar_data.fundReleaseLine)}</p>
                                </div>
                              )}
                              {request.seminar_data?.applicantUndertaking && (
                                <div className="pt-2 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Applicant's Undertaking</p>
                                  <p className="text-sm text-gray-700">
                                    ✓ I agree to liquidate advanced amounts within 5 working days, submit required documents, and serve as a resource speaker in an echo seminar.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments Section */}
                  <WowCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#7a0019]" />
                        Attached Documents
                      </h3>
                      {canEdit && !editingAttachments && (
                        <button
                          onClick={handleEditAttachments}
                          className="text-sm text-[#7a0019] hover:text-[#5a0010] font-medium flex items-center gap-1"
                        >
                          <Upload className="w-4 h-4" />
                          {request.attachments && request.attachments.length > 0 ? 'Edit' : 'Add'} Files
                        </button>
                      )}
                    </div>
                    
                    {editingAttachments ? (
                      <div className="space-y-4">
                        <FileAttachmentSection
                          attachments={currentAttachments}
                          onChange={setCurrentAttachments}
                        />
                        <div className="flex items-center gap-3 pt-4 border-t">
                          <button
                            onClick={handleSaveAttachments}
                            disabled={uploadingAttachments}
                            className="px-4 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-[#5a0010] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {uploadingAttachments ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              'Save Attachments'
                            )}
                          </button>
                          <button
                            onClick={handleCancelEditAttachments}
                            disabled={uploadingAttachments}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : request.attachments && Array.isArray(request.attachments) && request.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {request.attachments.map((attachment: any) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#7a0019] hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-[#7a0019]/10">
                              {attachment.mime?.includes('pdf') ? (
                                <FileText className="w-5 h-5 text-[#7a0019]" />
                              ) : attachment.mime?.includes('image') ? (
                                <FileText className="w-5 h-5 text-blue-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#7a0019]">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                                {attachment.uploaded_at && ` • ${formatLongDate(attachment.uploaded_at)}`}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#7a0019] flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm mb-2">No documents attached</p>
                        {canEdit && (
                          <button
                            onClick={handleEditAttachments}
                            className="text-sm text-[#7a0019] hover:text-[#5a0010] font-medium"
                          >
                            Click to add files
                          </button>
                        )}
                      </div>
                    )}
                  </WowCard>

                  {/* Seminar Codes Per Person - Show for seminar requests */}
                  {request.request_type === 'seminar' && request.seminar_code_per_person && Array.isArray(request.seminar_code_per_person) && request.seminar_code_per_person.length > 0 && (
                    <WowCard className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Seminar Codes Per Person
                      </h3>
                      <div className="space-y-2">
                        {request.seminar_code_per_person.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <p className="font-medium text-gray-900">{item.name || `Person ${idx + 1}`}</p>
                              {item.person_id && (
                                <p className="text-xs text-gray-500">ID: {item.person_id}</p>
                              )}
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-blue-300">
                              <span className="text-sm font-mono font-semibold text-blue-900">{item.code}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </WowCard>
                  )}

                  {/* Preferred Vehicle and Driver */}
                  {(request.preferred_vehicle || request.preferred_driver) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Preferences</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        {request.preferred_vehicle && (
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                              <Car className="w-5 h-5 text-[#7a0019]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500">Preferred Vehicle</p>
                              <p className="text-gray-900">{request.preferred_vehicle}</p>
                              {request.preferred_vehicle_note && (
                                <p className="text-sm text-gray-600 mt-1">{request.preferred_vehicle_note}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {request.preferred_driver && (
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                              <User className="w-5 h-5 text-[#7a0019]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500">Preferred Driver</p>
                              <p className="text-gray-900">{request.preferred_driver}</p>
                              {request.preferred_driver_note && (
                                <p className="text-sm text-gray-600 mt-1">{request.preferred_driver_note}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {request.participants && request.participants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Participants</h3>
                      <div className="space-y-3">
                        {request.participants.map((participant) => {
                          const safeParticipant = participant || {
                            id: 'unknown',
                            name: 'Unknown',
                            email: undefined,
                            position: undefined,
                            department: undefined,
                            profile_picture: null
                          };
                          return (
                            <PersonDisplay
                              key={safeParticipant.id}
                              person={safeParticipant}
                              size="sm"
                              showPosition
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Smart Features Summary */}
                  {hasSmartFeatures && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Smart Workflow Applied
                      </h3>
                      <p className="text-blue-700 text-sm mb-2">
                        This request benefited from intelligent automation:
                      </p>
                      <ul className="text-blue-600 text-sm space-y-1">
                        {request.smart_skips_applied?.map((skip, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                            {skip.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                      {request.efficiency_boost && (
                        <p className="text-blue-800 font-semibold text-sm mt-2">
                          Efficiency improvement: {request.efficiency_boost}% faster processing
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Timeline Tab - Enhanced Tracking */}
              {activeTab === 'timeline' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Enhanced Status Tracker */}
                  <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Route className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Approval Timeline</h3>
                        <p className="text-sm text-gray-600">Track your request through the approval process</p>
                      </div>
                    </div>
                    
                    <RequestStatusTracker
                      status={request.status as any}
                      requesterIsHead={request.requesterIsHead}
                      hasBudget={request.hasBudget}
                      hasParentHead={request.hasParentHead}
                      requiresPresidentApproval={request.requiresPresidentApproval}
                      bothVpsApproved={request.bothVpsApproved || false}
                      headApprovedAt={request.headApprovedAt}
                      headApprovedBy={request.headApprovedBy}
                      parentHeadApprovedAt={request.parentHeadApprovedAt}
                      parentHeadApprovedBy={request.parentHeadApprovedBy}
                      adminProcessedAt={request.adminProcessedAt}
                      adminProcessedBy={request.adminProcessedBy}
                      comptrollerApprovedAt={request.comptrollerApprovedAt}
                      comptrollerApprovedBy={request.comptrollerApprovedBy}
                      hrApprovedAt={request.hrApprovedAt}
                      hrApprovedBy={request.hrApprovedBy}
                      vpApprovedAt={request.vpApprovedAt}
                      vpApprovedBy={request.vpApprovedBy}
                      vp2ApprovedAt={request.vp2ApprovedAt}
                      vp2ApprovedBy={request.vp2ApprovedBy}
                      presidentApprovedAt={request.presidentApprovedAt}
                      presidentApprovedBy={request.presidentApprovedBy}
                      execApprovedAt={request.execApprovedAt}
                      execApprovedBy={request.execApprovedBy}
                      rejectedAt={request.rejectedAt}
                      rejectedBy={request.rejectedBy}
                      rejectionStage={request.rejectionStage}
                      compact={false}
                    />
                  </div>

                  {/* Additional Timeline Events (if available) */}
                  {request.timeline && request.timeline.length > 0 && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h4>
                      <div className="space-y-4">
                        {request.timeline.map((event: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{event.title || event.action}</p>
                              <p className="text-sm text-gray-600 mt-1">{event.description || event.comments}</p>
                              {event.created_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatLongDateTime(event.created_at)}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          </WowCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requester Panel - Show ALL requesters (main + confirmed) */}
          <WowCard className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-300">
              <div className="p-2 bg-[#7a0019] rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Requested By</h3>
            </div>
            <div className="space-y-4">
              {/* Main Requester (always show) */}
              {(() => {
                // Get requester signature from signatures array or direct field
                const requesterSignatureStage = request.signatures?.find((s: any) => s.id === 'requester' || s.role === 'Requester');
                const requesterSignature = request.requester_signature || requesterSignatureStage?.signature || null;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-5 bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full opacity-20"></div>
                    
                    <div className="relative flex items-start gap-4">
                      {/* Profile Picture */}
                      <div className="flex-shrink-0 relative z-10">
                        <div className="p-1 bg-white rounded-full shadow-md">
                          <ProfilePicture
                            src={request.requester?.profile_picture || null}
                            name={request.requester?.name || 'Unknown'}
                            size="lg"
                          />
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Name and Role */}
                        <div className="flex flex-col gap-2 mb-3">
                          <h4 className="text-lg font-bold text-gray-900 leading-tight break-words">
                            {request.requester?.name || 'Unknown'}
                          </h4>
                          {request.requester?.position && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 w-fit">
                              {request.requester.position}
                            </span>
                          )}
                        </div>
                        
                        {/* Email */}
                        {request.requester?.email && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-700 break-all">{request.requester.email}</p>
                          </div>
                        )}
                        
                        {/* Department */}
                        {request.requester?.department && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-800 break-words">{request.requester.department}</p>
                          </div>
                        )}
                        
                        {/* Signature */}
                        <div className="mt-4 pt-4 border-t-2 border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                              <PenTool className="w-4 h-4 text-gray-700" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">Digital Signature</span>
                          </div>
                          {requesterSignature ? (
                            <div className="bg-white rounded-lg border-2 border-gray-200 p-3 shadow-sm">
                              <img
                                src={requesterSignature}
                                alt={`${request.requester?.name || 'Requester'} signature`}
                                className="w-full h-20 object-contain"
                                onError={(e) => {
                                  console.error('[RequestDetailsView] Failed to load requester signature');
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                              <p className="text-sm text-gray-500">No signature provided</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Confirmed Additional Requesters */}
              {loadingRequesters ? (
                <div className="text-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A0010] border-t-transparent mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading requesters...</p>
                </div>
              ) : confirmedRequesters.length > 0 ? (
                (() => {
                  // Filter out main requester completely - they're already shown in the main requester card above
                  const mainRequesterEmail = request.requester?.email?.toLowerCase()?.trim();
                  const mainRequesterId = String(request.requester?.id || '');
                  
                  console.log('[RequestDetailsView] 🔍 Filtering confirmed requesters:', {
                    totalBeforeFilter: confirmedRequesters.length,
                    mainRequesterEmail,
                    mainRequesterId,
                    allRequesters: confirmedRequesters.map((r: any) => ({
                      name: r.name,
                      email: r.email,
                      user_id: String(r.user_id || ''),
                      invitation_id: r.id
                    }))
                  });
                  
                  const filtered = confirmedRequesters.filter((requester: any) => {
                    const requesterEmail = String(requester.email || '').toLowerCase().trim();
                    const requesterUserId = String(requester.user_id || '');
                    
                    // Check if this is the main requester by comparing:
                    // 1. Email (case-insensitive, trimmed)
                    // 2. user_id matches requester_id
                    const emailMatches = mainRequesterEmail && requesterEmail && requesterEmail === mainRequesterEmail;
                    const userIdMatches = mainRequesterId && requesterUserId && requesterUserId === mainRequesterId;
                    const isMainRequester = emailMatches || userIdMatches;
                    
                    if (isMainRequester) {
                      console.log('[RequestDetailsView] 🚫 FILTERING OUT - Main requester duplicate:', {
                        name: requester.name,
                        email: requester.email,
                        requesterUserId,
                        mainRequesterId,
                        emailMatches,
                        userIdMatches
                      });
                      return false;
                    }
                    
                    console.log('[RequestDetailsView] ✅ KEEPING - Additional requester:', {
                      name: requester.name,
                      email: requester.email,
                      requesterUserId,
                      mainRequesterId
                    });
                    return true;
                  });
                  
                  console.log('[RequestDetailsView] 📊 Filter results:', {
                    before: confirmedRequesters.length,
                    after: filtered.length,
                    filteredOut: confirmedRequesters.length - filtered.length
                  });
                  
                  return filtered;
                })().map((requester: any, index: number) => {
                    console.log('[RequestDetailsView] 🎨 Rendering confirmed requester:', {
                      index,
                      name: requester.name,
                      email: requester.email,
                      hasSignature: !!requester.signature,
                      signatureType: typeof requester.signature,
                      signatureLength: requester.signature?.length || 0,
                      signaturePreview: requester.signature?.substring(0, 50) || 'none'
                    });
                    return (
                  <motion.div
                    key={requester.id || requester.user_id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative p-5 bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-full opacity-20"></div>
                    
                    <div className="relative flex items-start gap-4">
                      {/* Profile Picture */}
                      <div className="flex-shrink-0 relative z-10">
                        <div className="p-1 bg-white rounded-full shadow-md">
                          <ProfilePicture
                            src={requester.profile_picture || null}
                            name={requester.name || 'Unknown'}
                            size="lg"
                          />
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Name, Role, and Status */}
                        <div className="flex flex-col gap-2 mb-3">
                          <h4 className="text-lg font-bold text-gray-900 leading-tight break-words">
                            {requester.name || requester.email || 'Unknown Requester'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {requester.position_title && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                                {requester.position_title}
                              </span>
                            )}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 border border-green-300 rounded-full shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-bold text-green-700">Confirmed</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Email */}
                        {requester.email && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-700 break-all">{requester.email}</p>
                          </div>
                        )}
                        
                        {/* Department */}
                        {requester.department && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-800 break-words">{requester.department}</p>
                          </div>
                        )}
                        
                        {/* Signature */}
                        <div className="mt-4 pt-4 border-t-2 border-green-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                              <PenTool className="w-4 h-4 text-gray-700" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">Digital Signature</span>
                          </div>
                          {requester.signature ? (
                            <div className="bg-white rounded-lg border-2 border-gray-200 p-3 shadow-sm">
                              <img
                                src={requester.signature}
                                alt={`${requester.name || 'Requester'} signature`}
                                className="w-full h-20 object-contain"
                                onError={(e) => {
                                  console.error('[RequestDetailsView] Failed to load signature image for:', requester.email);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                              <p className="text-sm text-gray-500">No signature provided</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                    );
                  })
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No additional confirmed requesters</p>
                </div>
              )}
            </div>
          </WowCard>

          {/* Routing Information Panel */}
          <WowCard className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-200">Routing Information</h3>
            <div className="space-y-3">
              {/* Current Status */}
              <div className="flex items-start justify-between">
                <span className="text-base text-gray-600 font-medium">Current Status</span>
                <span className="text-base font-semibold text-gray-900">{formatStatus(request.status)}</span>
              </div>
              
              {/* Determine routing based on status and workflow_metadata */}
              {(() => {
                const workflowMetadata = request.workflow_metadata || {};
                const nextVpId = workflowMetadata?.next_vp_id;
                const nextAdminId = workflowMetadata?.next_admin_id;
                const nextApproverRole = workflowMetadata?.next_approver_role;
                
                console.log('[RequestDetailsView] 🔍 Routing info check:', {
                  status: request.status,
                  workflowMetadata,
                  nextVpId,
                  nextAdminId,
                  nextApproverRole,
                  routingPerson,
                  department: request.department?.name
                });
                
                // Determine where request is currently routed
                let routingInfo = null;
                
                if (request.status === 'pending_head') {
                  // Check if head selected a specific approver (VP or Admin)
                  // This can happen in multi-department requests where status is still pending_head
                  // but head already sent it to admin/VP
                  if (routingPerson && (nextVpId || nextAdminId)) {
                    console.log('[RequestDetailsView] ✅ Showing routing person:', routingPerson.name);
                    routingInfo = {
                      label: 'Sent To',
                      value: routingPerson.name,
                      role: routingPerson.role || (nextVpId ? 'VP' : 'Administrator')
                    };
                  } else if (nextAdminId || nextApproverRole === 'admin') {
                    // Head sent to admin but routingPerson not loaded yet - show loading or fetch
                    console.log('[RequestDetailsView] ⚠️ Head sent to admin but routingPerson not loaded, nextAdminId:', nextAdminId);
                    routingInfo = {
                      label: 'Sent To',
                      value: loadingRoutingPerson ? 'Loading...' : 'Administrator',
                      role: 'Administrator'
                    };
                  } else if (nextVpId || nextApproverRole === 'vp') {
                    // Head sent to VP but routingPerson not loaded yet
                    console.log('[RequestDetailsView] ⚠️ Head sent to VP but routingPerson not loaded, nextVpId:', nextVpId);
                    routingInfo = {
                      label: 'Sent To',
                      value: loadingRoutingPerson ? 'Loading...' : 'Vice President',
                      role: 'VP'
                    };
                  } else {
                    // No specific approver selected - show department head
                    console.log('[RequestDetailsView] ⚠️ No routing person - showing department:', request.department?.name);
                    routingInfo = {
                      label: 'Sent To',
                      value: request.department?.name || 'Department Head',
                      role: 'Department Head'
                    };
                  }
                } else if (request.status === 'pending_parent_head') {
                  routingInfo = {
                    label: 'Sent To',
                    value: 'Parent Department Head',
                    role: 'Parent Head'
                  };
                } else if (request.status === 'pending_admin') {
                  // Show actual admin name if sent to specific admin
                  if (routingPerson) {
                    routingInfo = {
                      label: 'Sent To',
                      value: routingPerson.name,
                      role: routingPerson.role
                    };
                  } else {
                    // Fallback: Check if we can get admin name from head_approved_by
                    // If head sent to admin, we can show who approved it
                    if (request.head_approved_by) {
                      routingInfo = {
                        label: 'Sent To',
                        value: 'Administrator (sent by ' + (request.head_approver?.name || 'Department Head') + ')',
                        role: 'Administrator'
                      };
                    } else {
                      routingInfo = {
                        label: 'Sent To',
                        value: 'Administrator',
                        role: 'Administrator'
                      };
                    }
                  }
                } else if (request.status === 'pending_comptroller') {
                  routingInfo = {
                    label: 'Sent To',
                    value: 'Comptroller',
                    role: 'Comptroller'
                  };
                } else if (request.status === 'pending_hr') {
                  routingInfo = {
                    label: 'Sent To',
                    value: 'Human Resources',
                    role: 'HR'
                  };
                } else if (request.status === 'pending_exec') {
                  // Show actual VP name if sent to specific VP
                  if (routingPerson && nextVpId) {
                    routingInfo = {
                      label: 'Sent To',
                      value: routingPerson.name,
                      role: routingPerson.role
                    };
                  } else {
                    routingInfo = {
                      label: 'Sent To',
                      value: 'Vice President',
                      role: 'VP'
                    };
                  }
                } else if (request.status === 'pending_president') {
                  routingInfo = {
                    label: 'Sent To',
                    value: 'President',
                    role: 'President'
                  };
                } else if (request.status === 'approved' || request.status === 'dispatched' || request.status === 'completed') {
                  routingInfo = {
                    label: 'Status',
                    value: 'Approved',
                    role: 'Completed'
                  };
                }
                
                return routingInfo ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start justify-between pt-3 border-t border-gray-200"
                  >
                    <span className="text-base text-gray-600 font-medium flex items-center gap-2">
                      <Route className="w-4 h-4 text-gray-400" />
                      {routingInfo.label}
                    </span>
                    <div className="text-right">
                      <span className="text-base font-semibold text-gray-900 block">{routingInfo.value}</span>
                      <span className="text-sm text-gray-500">{routingInfo.role}</span>
                    </div>
                  </motion.div>
                ) : null;
              })()}
            </div>
          </WowCard>


          {/* Moved signatures to bottom */}

          {/* Actions */}
          <WowCard className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">Actions</h3>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    // Use API route for PDF generation (more reliable)
                    const res = await fetch(`/api/requests/${request.id}/pdf`);
                    if (!res.ok) {
                      const errorText = await res.text();
                      console.error('PDF API error:', res.status, errorText);
                      throw new Error(`Failed to generate PDF: ${res.status}`);
                    }
                    
                    // Get the PDF blob
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `travel-order-${request.request_number || request.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    console.error('Failed to generate PDF:', err);
                    alert(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
                  }
                }}
                className="flex items-center gap-2 w-full justify-center rounded-md bg-[#7A0010] hover:bg-[#5c000c] px-4 py-2.5 text-sm font-medium text-white transition"
              >
                <FileDown className="h-4 w-4" />
                Travel Order PDF
              </button>
            </div>
          </WowCard>
        </div>
      </div>
      
      {/* Approval Signatures Section - Full Width at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <WowCard className="mt-6">
          {/* Use the actual SignatureStageRail component with proper data */}
          <SignatureStageRail stages={request.signatures} />
        </WowCard>
      </motion.div>

    </div>
  );
}
