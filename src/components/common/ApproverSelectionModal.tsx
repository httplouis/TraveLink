"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, Building2, Mail, Phone, Search } from 'lucide-react';
import ProfilePicture from './ProfilePicture';
import { WowButton } from './Modal';

interface ApproverOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_picture?: string;
  position?: string;
  department?: string;
  role: string;
  roleLabel: string;
}

interface ApproverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (approverId: string, approverRole: string, returnReason?: string) => void;
  title: string;
  description?: string;
  options: ApproverOption[];
  currentRole?: string;
  allowReturnToRequester?: boolean;
  requesterId?: string;
  requesterName?: string;
  returnReasons?: Array<{ value: string; label: string }>;
}

export default function ApproverSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  options,
  currentRole,
  allowReturnToRequester = false,
  requesterId,
  requesterName,
  returnReasons = [
    { value: 'budget_change', label: 'Budget Change Required' },
    { value: 'driver_change', label: 'Driver/Vehicle Change Required' },
    { value: 'details_change', label: 'Request Details Need Revision' },
    { value: 'other', label: 'Other' }
  ]
}: ApproverSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setSearchQuery('');
      setReturnReason('');
      setIsReturning(false);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option => {
    const query = searchQuery.toLowerCase();
    return (
      option.name.toLowerCase().includes(query) ||
      option.position?.toLowerCase().includes(query) ||
      option.department?.toLowerCase().includes(query) ||
      option.roleLabel.toLowerCase().includes(query)
    );
  });

  const handleSelect = () => {
    if (isReturning && requesterId) {
      onSelect(requesterId, 'requester', returnReason);
    } else if (selectedId) {
      const selected = options.find(opt => opt.id === selectedId);
      if (selected) {
        onSelect(selectedId, selected.role);
      }
    }
  };

  const canSubmit = isReturning ? (requesterId && returnReason) : selectedId !== null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7a0019] to-[#5a0012] text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{title}</h2>
                {description && (
                  <p className="text-white/90 text-sm">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search */}
            {options.length > 3 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, position, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Return to Requester Option */}
            {allowReturnToRequester && requesterId && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setIsReturning(true);
                    setSelectedId(null);
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    isReturning
                      ? 'border-[#7a0019] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isReturning ? 'border-[#7a0019] bg-[#7a0019]' : 'border-gray-300'
                    }`}>
                      {isReturning && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Return to Requester</p>
                      <p className="text-sm text-gray-600">{requesterName || 'Requester'}</p>
                    </div>
                  </div>
                </button>

                {isReturning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 ml-7"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Return:
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                    >
                      <option value="">Select a reason...</option>
                      {returnReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>
            )}

            {/* Approver Options */}
            {!isReturning && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Select approver to send request to:
                </p>
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No approvers found{searchQuery ? ' matching your search' : ''}.</p>
                    {!searchQuery && (
                      <p className="text-xs text-gray-400">
                        You can still return this request to the requester for revision.
                      </p>
                    )}
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedId(option.id);
                        setIsReturning(false);
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        selectedId === option.id
                          ? 'border-[#7a0019] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          selectedId === option.id ? 'border-[#7a0019] bg-[#7a0019]' : 'border-gray-300'
                        }`}>
                          {selectedId === option.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <ProfilePicture
                          src={option.profile_picture}
                          name={option.name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{option.name}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {option.position}
                            {option.department && ` • ${option.department}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {option.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {option.email}
                              </span>
                            )}
                            {option.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {option.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="px-3 py-1 bg-[#7a0019]/10 text-[#7a0019] rounded-full text-xs font-medium">
                            {option.roleLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
              <WowButton variant="outline" onClick={onClose}>
                Cancel
              </WowButton>
              <WowButton
                variant="primary"
                onClick={handleSelect}
                disabled={!canSubmit}
              >
                {isReturning ? 'Return to Requester' : 'Send to Selected Approver'}
              </WowButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

