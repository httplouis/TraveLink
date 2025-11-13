"use client";

import { motion } from 'framer-motion';
import { Check, Clock, X, Zap, AlertCircle } from 'lucide-react';
import { formatPhilippineDate, formatLongDateTime } from '@/lib/datetime';
import ProfilePicture from './ProfilePicture';
import { NameWithProfile } from './ProfileHoverCard';

interface SignatureStage {
  id: string;
  label: string;
  role: string;
  status: 'pending' | 'approved' | 'skipped' | 'returned' | 'next';
  approver?: {
    id: string;
    name: string;
    profile_picture?: string;
    department?: string;
    position?: string;
    email?: string;
  };
  signature?: string; // Base64 image or signature data
  approved_at?: string;
  skip_reason?: string;
  return_reason?: string;
  is_current_user?: boolean;
}

interface SignatureStageRailProps {
  stages: SignatureStage[];
  className?: string;
}

export default function SignatureStageRail({ 
  stages, 
  className = '' 
}: SignatureStageRailProps) {
  
  const getStageIcon = (stage: SignatureStage) => {
    switch (stage.status) {
      case 'approved':
        return <Check className="w-4 h-4 text-white" />;
      case 'skipped':
        return <Zap className="w-4 h-4 text-white" />;
      case 'returned':
        return <X className="w-4 h-4 text-white" />;
      case 'next':
        return <AlertCircle className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getStageColor = (stage: SignatureStage) => {
    switch (stage.status) {
      case 'approved':
        return 'bg-green-500';
      case 'skipped':
        return 'bg-blue-500';
      case 'returned':
        return 'bg-red-500';
      case 'next':
        return 'bg-[#7a0019] ring-4 ring-[#7a0019]/20';
      default:
        return 'bg-gray-300';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    return formatLongDateTime(dateString);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Approval Signatures</h3>
      
      <div className="space-y-6">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              relative flex items-start space-x-4 p-4 rounded-lg border-2 transition-all
              ${stage.status === 'next' 
                ? 'border-[#7a0019] bg-red-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {/* Stage Icon */}
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${getStageColor(stage)}
            `}>
              {getStageIcon(stage)}
            </div>

            {/* Stage Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{stage.label}</h4>
                <div className="flex items-center space-x-2">
                  {stage.status === 'next' && stage.is_current_user && (
                    <span className="bg-[#7a0019] text-white text-xs px-2 py-1 rounded-full font-medium">
                      You're Next
                    </span>
                  )}
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${stage.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    ${stage.status === 'skipped' ? 'bg-blue-100 text-blue-800' : ''}
                    ${stage.status === 'returned' ? 'bg-red-100 text-red-800' : ''}
                    ${stage.status === 'next' ? 'bg-orange-100 text-orange-800' : ''}
                    ${stage.status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
                  `}>
                    {stage.status === 'approved' && 'Approved'}
                    {stage.status === 'skipped' && 'Skipped'}
                    {stage.status === 'returned' && 'Returned'}
                    {stage.status === 'next' && 'Pending'}
                    {stage.status === 'pending' && 'Waiting'}
                  </span>
                </div>
              </div>

              {/* Approver Info */}
              {stage.approver && (
                <div className="flex items-center space-x-3 mb-3">
                  <ProfilePicture
                    src={stage.approver.profile_picture}
                    name={stage.approver.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      <NameWithProfile 
                        name={stage.approver.name}
                        profile={stage.approver}
                      />
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {stage.approver.position && stage.approver.department 
                        ? `${stage.approver.position}, ${stage.approver.department}`
                        : stage.approver.position || stage.approver.department || stage.role
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Status Details */}
              {stage.status === 'approved' && stage.approved_at && (
                <p className="text-sm text-gray-600 mb-3">
                  Approved on {formatDateTime(stage.approved_at)}
                </p>
              )}

              {stage.status === 'skipped' && stage.skip_reason && (
                <p className="text-sm text-blue-600 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {stage.skip_reason}
                </p>
              )}

              {stage.status === 'returned' && stage.return_reason && (
                <p className="text-sm text-red-600 mb-3">
                  Returned: {stage.return_reason}
                </p>
              )}

              {/* Digital Signature */}
              {stage.signature && stage.status === 'approved' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digital Signature:
                  </label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-w-xs">
                    <img 
                      src={stage.signature}
                      alt={`${stage.approver?.name || 'Approver'} signature`}
                      className="max-h-16 mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Connection Line */}
            {index < stages.length - 1 && (
              <div className="absolute left-9 top-16 w-0.5 h-8 bg-gray-200"></div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Next Steps Info */}
      {stages.some(s => s.status === 'next') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium text-sm">
              Waiting for approval from the next approver in the chain
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
