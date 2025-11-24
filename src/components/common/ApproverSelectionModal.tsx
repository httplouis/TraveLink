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
  department_id?: string; // For filtering by department
  role: string; // Actual role code (e.g., "vp", "admin", "hr")
  roleLabel?: string; // Display label (e.g., "Vice President", "Administrator")
}

interface ApproverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (approverId: string | string[], approverRole: string | string[], returnReason?: string) => void;
  title: string;
  description?: string;
  options: ApproverOption[];
  currentRole?: string;
  allowReturnToRequester?: boolean;
  requesterId?: string;
  requesterName?: string;
  returnReasons?: Array<{ value: string; label: string }>;
  loading?: boolean;
  defaultApproverId?: string; // For defaulting to specific approver (e.g., Ma'am TM)
  defaultApproverName?: string; // For display purposes
  suggestionReason?: string; // NEW: Reason why this approver was suggested
  allowAllUsers?: boolean; // NEW: Allow selecting from all users, not just specific roles
  fetchAllUsers?: () => Promise<ApproverOption[]>; // NEW: Function to fetch all users
  allowMultiple?: boolean; // NEW: Allow selecting multiple recipients
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
  ],
  loading = false,
  defaultApproverId,
  defaultApproverName,
  suggestionReason,
  allowAllUsers = false,
  fetchAllUsers,
  allowMultiple = false
}: ApproverSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsersOptions, setAllUsersOptions] = useState<ApproverOption[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setSelectedIds([]);
      setSearchQuery('');
      setReturnReason('');
      setIsReturning(false);
      setShowAllUsers(false);
      setAllUsersOptions([]);
    } else {
      if (allowMultiple) {
        // For multiple selection, pre-select default if provided
        if (defaultApproverId && options.some(opt => opt.id === defaultApproverId)) {
          setSelectedIds([defaultApproverId]);
        }
      } else {
        // Priority: defaultApproverId > single option > no selection
        if (defaultApproverId && options.some(opt => opt.id === defaultApproverId)) {
          // Default approver exists in options, auto-select it
          setSelectedId(defaultApproverId);
        } else if (options.length === 1 && !allowReturnToRequester) {
          // Auto-select if only one option available (but allow change)
          setSelectedId(options[0].id);
        }
      }
    }
  }, [isOpen, options, allowReturnToRequester, defaultApproverId, allowMultiple]);

  // Fetch all users when "Show All Users" is toggled
  useEffect(() => {
    if (showAllUsers && allowAllUsers && fetchAllUsers && allUsersOptions.length === 0) {
      setLoadingAllUsers(true);
      fetchAllUsers()
        .then((users) => {
          setAllUsersOptions(users);
        })
        .catch((err) => {
          console.error("[ApproverSelectionModal] Error fetching all users:", err);
        })
        .finally(() => {
          setLoadingAllUsers(false);
        });
    }
  }, [showAllUsers, allowAllUsers, fetchAllUsers, allUsersOptions.length]);

  // Use all users options if "Show All Users" is enabled, otherwise use regular options
  const activeOptions = showAllUsers && allowAllUsers ? allUsersOptions : options;
  
  const filteredOptions = activeOptions
    .filter(option => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        option.name.toLowerCase().includes(query) ||
        option.email?.toLowerCase().includes(query) ||
        option.position?.toLowerCase().includes(query) ||
        option.department?.toLowerCase().includes(query) ||
        (option.roleLabel || '').toLowerCase().includes(query) ||
        option.phone?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Priority 1: Sort suggested approver (defaultApproverId) to the VERY TOP
      if (defaultApproverId) {
        if (a.id === defaultApproverId) return -1;
        if (b.id === defaultApproverId) return 1;
      }
      
      // Priority 2: If suggestion exists, sort by role priority (suggested role first)
      if (suggestionReason) {
        // Extract suggested role from reason (e.g., "HR" or "Comptroller")
        const suggestedRole = suggestionReason.toLowerCase().includes('hr') ? 'hr' :
                             suggestionReason.toLowerCase().includes('comptroller') ? 'comptroller' : null;
        
        if (suggestedRole) {
          const aIsSuggestedRole = a.role?.toLowerCase() === suggestedRole || 
                                   a.roleLabel?.toLowerCase().includes(suggestedRole);
          const bIsSuggestedRole = b.role?.toLowerCase() === suggestedRole || 
                                   b.roleLabel?.toLowerCase().includes(suggestedRole);
          
          if (aIsSuggestedRole && !bIsSuggestedRole) return -1;
          if (!aIsSuggestedRole && bIsSuggestedRole) return 1;
        }
      }
      
      // Priority 3: Sort HR before Comptroller (HR is usually next after admin)
      const aIsHR = a.role?.toLowerCase() === 'hr' || a.roleLabel?.toLowerCase().includes('hr');
      const bIsHR = b.role?.toLowerCase() === 'hr' || b.roleLabel?.toLowerCase().includes('hr');
      const aIsComptroller = a.role?.toLowerCase() === 'comptroller' || a.roleLabel?.toLowerCase().includes('comptroller');
      const bIsComptroller = b.role?.toLowerCase() === 'comptroller' || b.roleLabel?.toLowerCase().includes('comptroller');
      
      if (aIsHR && bIsComptroller) return -1;
      if (aIsComptroller && bIsHR) return 1;
      
      // Priority 4: Keep original order for others
      return 0;
    });

  const handleSelect = () => {
    if (isReturning && requesterId) {
      onSelect(requesterId, 'requester', returnReason);
    } else if (allowMultiple && selectedIds.length > 0) {
      // Multiple selection mode
      const selected = activeOptions.filter(opt => selectedIds.includes(opt.id));
      const approverIds = selected.map(s => s.id);
      const approverRoles = selected.map(s => s.role || 'user');
      onSelect(approverIds, approverRoles);
    } else if (selectedId) {
      // Single selection mode
      const selected = activeOptions.find(opt => opt.id === selectedId);
      if (selected) {
        // Always use the actual role code (not roleLabel) - approval endpoints will fetch actual role from DB anyway
        // But we pass it as a hint for the endpoint to know what to expect
        const roleToSend = selected.role || 'user';
        onSelect(selectedId, roleToSend);
      }
    }
  };

  const canSubmit = isReturning 
    ? (requesterId && returnReason) 
    : allowMultiple 
      ? selectedIds.length > 0 
      : selectedId !== null;

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
            {/* Loading State */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-48 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show All Users Toggle */}
            {!loading && allowAllUsers && !showAllUsers && (
              <div className="mb-4">
                <button
                  onClick={() => setShowAllUsers(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#7a0019] hover:bg-red-50 transition-all text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#7a0019]">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Show All Users</span>
                    <span className="text-xs text-gray-500">(Select from anyone in the system)</span>
                  </div>
                </button>
              </div>
            )}

            {/* Back to Role-Based Options */}
            {!loading && showAllUsers && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowAllUsers(false);
                    setSelectedId(null);
                    setSearchQuery('');
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg hover:border-[#7a0019] hover:bg-red-50 transition-all text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#7a0019]">
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Back to Role-Based Options</span>
                  </div>
                </button>
              </div>
            )}

            {/* Search - Always show if there are options */}
            {!loading && (activeOptions.length > 0 || loadingAllUsers) && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, position, or department..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && !isReturning && filteredOptions.length > 0) {
                        e.preventDefault();
                        setFocusedIndex(prev => 
                          prev < filteredOptions.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === 'ArrowUp' && !isReturning && filteredOptions.length > 0) {
                        e.preventDefault();
                        setFocusedIndex(prev => prev > 0 ? prev - 1 : filteredOptions.length - 1);
                      } else if (e.key === 'Enter' && focusedIndex >= 0 && !isReturning) {
                        e.preventDefault();
                        const option = filteredOptions[focusedIndex];
                        if (option) {
                          setSelectedId(option.id);
                          setIsReturning(false);
                        }
                      } else if (e.key === 'Escape') {
                        onClose();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-2 text-xs text-gray-500">
                    {filteredOptions.length} {filteredOptions.length === 1 ? 'result' : 'results'} found
                  </p>
                )}
              </div>
            )}

            {/* Return to Requester Option - REMOVED: Use Reject button instead */}

            {/* Loading All Users */}
            {loadingAllUsers && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-48 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Suggestion Banner */}
            {!loading && !loadingAllUsers && !isReturning && defaultApproverId && suggestionReason && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Suggested: {defaultApproverName || 'Next Approver'}
                    </p>
                    <p className="text-xs text-blue-700">
                      {suggestionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approver Options */}
            {!loading && !loadingAllUsers && !isReturning && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {showAllUsers && allowAllUsers 
                    ? "Select any user to send request to:" 
                    : "Select approver to send request to:"}
                </p>
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="mb-2 font-medium">No approvers found{searchQuery ? ' matching your search' : ''}.</p>
                    {!searchQuery && options.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          No administrators are currently available in the system.
                        </p>
                        <p className="text-xs text-gray-400">
                          You can still return this request to the requester for revision.
                        </p>
                      </div>
                    ) : searchQuery ? (
                      <p className="text-xs text-gray-400">
                        Try a different search term or clear the search to see all options.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = allowMultiple 
                      ? selectedIds.includes(option.id)
                      : selectedId === option.id;
                    
                    return (
                    <motion.button
                      key={option.id}
                      onClick={() => {
                        if (allowMultiple) {
                          setSelectedIds(prev => 
                            prev.includes(option.id)
                              ? prev.filter(id => id !== option.id)
                              : [...prev, option.id]
                          );
                        } else {
                          setSelectedId(option.id);
                        }
                        setIsReturning(false);
                        setFocusedIndex(-1);
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      onFocus={() => setFocusedIndex(index)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-[#7a0019] bg-red-50 shadow-md ring-2 ring-[#7a0019]/20'
                          : defaultApproverId === option.id
                          ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                          : focusedIndex === index
                          ? 'border-[#7a0019]/50 bg-red-50/50 shadow-sm ring-1 ring-[#7a0019]/10'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          isSelected ? 'border-[#7a0019] bg-[#7a0019]' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <ProfilePicture
                          src={option.profile_picture}
                          name={option.name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">{option.name}</p>
                            {defaultApproverId === option.id && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Suggested
                              </span>
                            )}
                          </div>
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
                    </motion.button>
                    );
                  })
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
                {isReturning 
                  ? 'Return to Requester' 
                  : allowMultiple && selectedIds.length > 0
                    ? `Send to ${selectedIds.length} ${selectedIds.length === 1 ? 'Recipient' : 'Recipients'}`
                    : 'Send to Selected Approver'}
              </WowButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

