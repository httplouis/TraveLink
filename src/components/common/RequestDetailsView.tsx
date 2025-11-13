"use client";

import { useState } from 'react';
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
  Route
} from 'lucide-react';
import { WowCard, WowButton } from './Modal';
import ProfilePicture, { PersonDisplay } from './ProfilePicture';
import { NameWithProfile } from './ProfileHoverCard';
import SignatureStageRail from './SignatureStageRail';
import TrackingTimeline from './TrackingTimeline';
import { formatLongDate, formatLongDateTime } from '@/lib/datetime';

interface RequestData {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
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
  pickup_time?: string;
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
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'attachments'>('details');

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
    return formatLongDate(dateString);
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
      'returned': 'bg-red-100 text-red-800 border-red-200',
      'dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const hasSmartFeatures = request.smart_skips_applied && request.smart_skips_applied.length > 0;

  return (
    <div className={`max-w-6xl mx-auto space-y-6 p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#7a0019] to-[#5a0012] text-white rounded-xl p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">{request.request_number}</h1>
              {hasSmartFeatures && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  Smart Skip Active
                </div>
              )}
            </div>
            <p className="text-white/90 text-lg mb-4">{request.title}</p>
            <div className="flex items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(request.travel_start_date)}
                {request.travel_start_date !== request.travel_end_date && 
                  ` - ${formatDate(request.travel_end_date)}`
                }
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {request.destination}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`
              px-4 py-2 rounded-full text-sm font-medium border
              ${getStatusColor(request.status)}
            `}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                  { id: 'timeline', label: 'Timeline', icon: Clock },
                  { id: 'attachments', label: 'Attachments', icon: FileText }
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
                  {/* Purpose */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Purpose</h3>
                    <p className="text-gray-700 leading-relaxed">{request.purpose}</p>
                  </div>

                  {/* Travel Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                          <MapPin className="w-5 h-5 text-[#7a0019]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Destination</p>
                          <p className="text-gray-900">{request.destination}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                          <Building2 className="w-5 h-5 text-[#7a0019]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Department</p>
                          <p className="text-gray-900">{request.department.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                          <Clock className="w-5 h-5 text-[#7a0019]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date Requested</p>
                          <p className="text-gray-900">{formatDate(request.created_at || request.travel_start_date)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                          <Calendar className="w-5 h-5 text-[#7a0019]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Travel Dates</p>
                          <p className="text-gray-900">
                            {formatDate(request.travel_start_date)}
                            {request.travel_start_date !== request.travel_end_date && 
                              ` - ${formatDate(request.travel_end_date)}`
                            }
                          </p>
                        </div>
                      </div>

                      {request.total_budget > 0 && (
                        <div>
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                              <Banknote className="w-5 h-5 text-[#7a0019]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Budget</p>
                              <p className="text-gray-900 font-semibold">
                                {formatCurrency(request.total_budget)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Budget Breakdown */}
                          <div className="ml-8 mt-3 bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Budget Breakdown</h4>
                            {request.expense_breakdown && request.expense_breakdown.length > 0 ? (
                              <div className="space-y-2">
                                {request.expense_breakdown.map((expense, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <div>
                                      <span className="text-gray-900 font-medium">{expense.category}</span>
                                      {expense.description && (
                                        <p className="text-gray-500 text-xs">{expense.description}</p>
                                      )}
                                    </div>
                                    <span className="text-gray-900 font-semibold">
                                      {formatCurrency(expense.amount)}
                                    </span>
                                  </div>
                                ))}
                                <div className="border-t pt-2 mt-2 flex justify-between items-center text-sm font-semibold">
                                  <span className="text-gray-900">Total</span>
                                  <span className="text-[#7a0019]">{formatCurrency(request.total_budget)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">No detailed breakdown available</p>
                                <p className="text-gray-400 text-xs mt-1">Total budget: {formatCurrency(request.total_budget)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Budget Justification */}
                  {request.cost_justification && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget Justification</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                            <FileText className="w-5 h-5 text-[#7a0019]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {request.cost_justification}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transportation */}
                  {request.transportation_type && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Transportation</h3>
                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-[#7a0019]" />
                        <div>
                          <p className="text-gray-900">
                            {request.transportation_type === 'pickup' 
                              ? 'University Vehicle (Pick-up)' 
                              : 'Own Transportation'
                            }
                          </p>
                          {request.pickup_location && (
                            <p className="text-sm text-gray-600">
                              Pick-up: {request.pickup_location}
                              {request.pickup_time && ` at ${request.pickup_time}`}
                            </p>
                          )}
                        </div>
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

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <TrackingTimeline events={request.timeline} />
                </motion.div>
              )}

              {/* Attachments Tab */}
              {activeTab === 'attachments' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center py-12"
                >
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attachments uploaded</p>
                </motion.div>
              )}
            </div>
          </WowCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Panel */}
          <WowCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requested By</h3>
            <PersonDisplay
              person={request.requester}
              size="md"
              showEmail
              showPosition
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Role</span>
                <span className="font-medium text-gray-900">Requester</span>
              </div>
            </div>
          </WowCard>

          {/* Moved signatures to bottom */}

          {/* Actions */}
          <WowCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
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
                <Route className="w-4 h-4" />
                View Tracking
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
