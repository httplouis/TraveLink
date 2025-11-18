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
  PenTool
} from 'lucide-react';
import { WowCard, WowButton } from './Modal';
import ProfilePicture, { PersonDisplay } from './ProfilePicture';
import { NameWithProfile } from './ProfileHoverCard';
import SignatureStageRail from './SignatureStageRail';
import RequestStatusTracker from './RequestStatusTracker';
import { formatLongDate, formatLongDateTime } from '@/lib/datetime';

export interface RequestData {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  destination_geo?: { lat: number; lng: number; address?: string } | null;
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
  pickup_location?: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
  pickup_time?: string;
  pickup_contact_number?: string;
  pickup_special_instructions?: string;
  return_transportation_same?: boolean;
  dropoff_location?: string;
  dropoff_time?: string;
  parking_required?: boolean;
  own_vehicle_details?: string;
  cost_justification?: string;
  preferred_vehicle?: string;
  preferred_driver?: string;
  preferred_vehicle_note?: string;
  preferred_driver_note?: string;
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
  
  // Smart workflow fields
  smart_skips_applied?: string[];
  efficiency_boost?: number;
  requires_budget?: boolean;
  
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

  // Fetch confirmed requesters
  useEffect(() => {
    if (request?.id) {
      fetchConfirmedRequesters();
    }
  }, [request?.id]);

  const fetchConfirmedRequesters = async () => {
    try {
      setLoadingRequesters(true);
      const response = await fetch(`/api/requesters/status?request_id=${request.id}`);
      const data = await response.json();
      
      if (data.ok && data.data) {
        // Filter only confirmed requesters
        const confirmed = data.data.filter((req: any) => req.status === 'confirmed');
        setConfirmedRequesters(confirmed);
      }
    } catch (err) {
      console.error('[RequestDetailsView] Error fetching confirmed requesters:', err);
    } finally {
      setLoadingRequesters(false);
    }
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
  console.log('RequestDetailsView DEBUG:', {
    transportation_type: request.transportation_type,
    preferred_vehicle: request.preferred_vehicle,
    preferred_driver: request.preferred_driver,
    preferred_vehicle_note: request.preferred_vehicle_note,
    preferred_driver_note: request.preferred_driver_note
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
              <h1 className="text-3xl font-extrabold tracking-tight">{request.request_number}</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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


                  {/* Budget Justification */}
                  {request.cost_justification && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget Justification</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{request.cost_justification}</p>
                    </div>
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
                              <p className="text-gray-900">{request.seminar_data.applicationDate ? formatDate(request.seminar_data.applicationDate) : '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Training Category</p>
                              <p className="text-gray-900 capitalize">{request.seminar_data.trainingCategory || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Modality</p>
                              <p className="text-gray-900">{request.seminar_data.modality || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Sponsor / Partner</p>
                              <p className="text-gray-900">{request.seminar_data.sponsor || '—'}</p>
                            </div>
                            {request.seminar_data.days && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Number of Days</p>
                                <p className="text-gray-900">{request.seminar_data.days} {request.seminar_data.days === 1 ? 'day' : 'days'}</p>
                              </div>
                            )}
                            {request.seminar_data.venue && (
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
                        {request.seminar_data.typeOfTraining && request.seminar_data.typeOfTraining.length > 0 && (
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
                        {request.seminar_data.applicants && request.seminar_data.applicants.length > 0 && (
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
                        {request.seminar_data.breakdown && request.seminar_data.breakdown.length > 0 && (
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
                              {request.seminar_data.registrationCost && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Registration Cost:</span>
                                  <span className="text-gray-900 font-medium">{formatCurrency(request.seminar_data.registrationCost)}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total Amount:</span>
                                <span className="text-[#7a0019] font-bold text-lg">
                                  {(() => {
                                    const breakdownTotal = request.seminar_data.breakdown?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
                                    const registrationCost = request.seminar_data.registrationCost || 0;
                                    const calculatedTotal = breakdownTotal + registrationCost;
                                    if (calculatedTotal > 0) {
                                      return formatCurrency(calculatedTotal);
                                    } else if (request.seminar_data.totalAmount) {
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
                        {(request.seminar_data.makeUpClassSchedule || request.seminar_data.fundReleaseLine !== null || request.seminar_data.applicantUndertaking) && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                            <div className="space-y-4">
                              {request.seminar_data.makeUpClassSchedule && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Make-up Class Schedule</p>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.seminar_data.makeUpClassSchedule}</p>
                                </div>
                              )}
                              {request.seminar_data.fundReleaseLine !== null && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Fund Release Line</p>
                                  <p className="text-gray-900 font-semibold">{formatCurrency(request.seminar_data.fundReleaseLine)}</p>
                                </div>
                              )}
                              {request.seminar_data.applicantUndertaking && (
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
                        {request.participants.map((participant) => (
                          <PersonDisplay
                            key={participant.id}
                            person={participant}
                            size="sm"
                            showPosition
                          />
                        ))}
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
        <div className="space-y-6">
          {/* Requester Panel */}
          <WowCard className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">Requested By</h3>
            <div className="mb-6">
              <PersonDisplay
                person={request.requester}
                size="md"
                showEmail
                showPosition
              />
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Role</span>
                <span className="font-bold text-gray-900">Requester</span>
              </div>
            </div>
          </WowCard>

          {/* Confirmed Requesters Panel */}
          {confirmedRequesters.length > 0 && (
            <WowCard className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                Additional Requesters
              </h3>
              <div className="space-y-4">
                {loadingRequesters ? (
                  <div className="text-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A0010] border-t-transparent mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading requesters...</p>
                  </div>
                ) : (
                  confirmedRequesters.map((requester, index) => (
                    <motion.div
                      key={requester.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      {/* Requester Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0">
                          {requester.user_id ? (
                            <ProfilePicture
                              userId={requester.user_id}
                              name={requester.name || 'Unknown'}
                              size="sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {requester.name || requester.email || 'Unknown Requester'}
                          </p>
                          {requester.department && (
                            <p className="text-xs text-gray-600 mt-0.5">{requester.department}</p>
                          )}
                          {requester.email && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{requester.email}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Confirmed</span>
                          </div>
                        </div>
                      </div>

                      {/* Signature */}
                      {requester.signature && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <PenTool className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-900">Signature</span>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-green-200">
                            <img
                              src={requester.signature}
                              alt={`${requester.name || 'Requester'} signature`}
                              className="w-full h-16 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Confirmation Time */}
                      {requester.confirmed_at && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              Confirmed: <span className="font-medium text-gray-900">{formatLongDateTime(requester.confirmed_at)}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </WowCard>
          )}

          {/* Moved signatures to bottom */}

          {/* Actions */}
          <WowCard className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">Actions</h3>
            <div className="space-y-4">
              <WowButton 
                variant="outline" 
                className="w-full justify-start"
                onClick={onPrint}
              >
                <Printer className="w-4 h-4" />
                Print Request
              </WowButton>
              
              
              <WowButton 
                variant="outline" 
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4" />
                Copy Link
              </WowButton>
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
