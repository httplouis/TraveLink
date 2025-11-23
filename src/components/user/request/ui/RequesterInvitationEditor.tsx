// src/components/user/request/ui/RequesterInvitationEditor.tsx
"use client";

import * as React from "react";
import { Mail, CheckCircle2, XCircle, Clock, Send, UserPlus, AlertCircle, Copy, Check, X, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import Modal from "@/components/common/Modal";
import UserSearchableSelect from "./UserSearchableSelect";

interface RequesterInvitation {
  id: string; // Unique ID for this requester slot
  name: string; // User's name
  email?: string; // User's email
  department?: string; // Auto-filled from user's department
  department_id?: string; // Department ID
  user_id?: string; // User ID from database
  status?: 'pending' | 'confirmed' | 'declined' | 'expired';
  invitationId?: string; // ID from database after sending invitation
  signature?: string; // Base64 signature (if confirmed)
}

interface RequesterInvitationEditorProps {
  requesters: RequesterInvitation[];
  onChange: (requesters: RequesterInvitation[]) => void;
  requestId?: string; // For sending invitations (after request is saved)
  disabled?: boolean; // Disable when request is submitted
  onStatusChange?: (allConfirmed: boolean) => void; // Callback when status changes
  requesterRole?: "faculty" | "head"; // Role type for filtering users
  currentUserEmail?: string; // Current logged-in user's email (for auto-confirm)
  onAutoSaveRequest?: () => Promise<string | null>; // Callback to auto-save draft and return requestId
}

export default function RequesterInvitationEditor({
  requesters,
  onChange,
  requestId,
  disabled = false,
  onStatusChange,
  requesterRole = "faculty",
  currentUserEmail,
  onAutoSaveRequest,
}: RequesterInvitationEditorProps) {
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [linkToShow, setLinkToShow] = React.useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();
  const [sending, setSending] = React.useState<string | null>(null); // requester ID being sent
  const [sendingAll, setSendingAll] = React.useState(false);
  const [searchingUser, setSearchingUser] = React.useState<string | null>(null); // ID of slot being searched
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null);
  const notifiedStatusRef = React.useRef<Map<string, string>>(new Map()); // Track notified status changes
  
  // Cooldown state (10 seconds)
  const [lastSendTime, setLastSendTime] = React.useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = React.useState(0);
  const COOLDOWN_DURATION = 10000; // 10 seconds in milliseconds

  // Auto-confirm requesters who are the current user
  React.useEffect(() => {
    if (currentUserEmail) {
      console.log('[RequesterInvitationEditor] 🔍 Current user email:', currentUserEmail);
      requesters.forEach((req, idx) => {
        if (req.email) {
          const isMatch = req.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
          console.log(`[RequesterInvitationEditor] Requester #${idx + 1}:`, {
            email: req.email,
            isCurrentUser: isMatch,
            currentUserEmail: currentUserEmail,
            status: req.status,
            invitationId: req.invitationId,
          });
          
          // Auto-confirm if it's the current user but not yet confirmed
          if (isMatch && req.status !== 'confirmed' && req.invitationId !== 'auto-confirmed') {
            console.log(`[RequesterInvitationEditor] ✅ Auto-confirming requester #${idx + 1} (current user)`);
            updateRequester(req.id, {
              invitationId: 'auto-confirmed',
              status: 'confirmed',
            });
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail]); // Only depend on currentUserEmail, not requesters to avoid loops

  // Check if all requesters are confirmed
  const allConfirmed = requesters.length > 0 && requesters.every(req => req.status === 'confirmed');
  const hasPendingInvitations = requesters.some(req => !req.invitationId && req.status === 'pending');
  const hasSentInvitations = requesters.some(req => req.invitationId);
  const pendingInvitations = requesters.filter(req => !req.invitationId && req.status === 'pending');

  // Track previous allConfirmed value to avoid infinite loops
  const prevAllConfirmedRef = React.useRef<boolean | undefined>(undefined);
  const onStatusChangeRef = React.useRef(onStatusChange);

  // Keep ref updated
  React.useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Notify parent when status changes
  React.useEffect(() => {
    if (onStatusChangeRef.current && prevAllConfirmedRef.current !== allConfirmed) {
      prevAllConfirmedRef.current = allConfirmed;
      setTimeout(() => {
        onStatusChangeRef.current?.(allConfirmed);
      }, 0);
    }
  }, [allConfirmed]);

  const addRequesterSlot = () => {
    const newRequester: RequesterInvitation = {
      id: `requester-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      status: 'pending',
    };
    onChange([...requesters, newRequester]);
  };

  const removeRequester = (id: string) => {
    // Allow removing all requesters (for form clearing)
    const updatedRequesters = requesters.filter(req => req.id !== id);
    onChange(updatedRequesters);
    
    // Also clear any invitation data for this requester if it exists
    if (requestId) {
      // Optionally: Delete invitation from database if it exists
      // This is handled by the backend when the request is saved
    }
  };

  const updateRequester = (id: string, updates: Partial<RequesterInvitation>) => {
    onChange(requesters.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  // Handle user selection from search
  const handleUserSelect = async (id: string, userName: string) => {
    // Clear existing data first when changing user
    updateRequester(id, {
      name: userName,
      email: undefined,
      department: undefined,
      department_id: undefined,
      user_id: undefined,
      invitationId: undefined,
      status: 'pending',
    });
    
    setSearchingUser(id);
    try {
      // Fetch user details from API - try exact name match first
      let response = await fetch(`/api/users/search?q=${encodeURIComponent(userName)}&role=${requesterRole}`);
      let data = await response.json();
      
      // If no results, try without role filter (broader search)
      if (!data.ok || !data.users || data.users.length === 0) {
        console.log(`[RequesterInvitationEditor] No results with role filter, trying without role filter...`);
        response = await fetch(`/api/users/search?q=${encodeURIComponent(userName)}`);
        data = await response.json();
      }
      
      if (data.ok && data.users && data.users.length > 0) {
        // Find exact match by name (case-insensitive)
        let user = data.users.find((u: any) => 
          u.name?.toLowerCase().trim() === userName.toLowerCase().trim()
        );
        
        // If no exact match, try partial match (contains)
        if (!user) {
          user = data.users.find((u: any) => 
            u.name?.toLowerCase().includes(userName.toLowerCase().trim()) ||
            userName.toLowerCase().trim().includes(u.name?.toLowerCase() || '')
          );
        }
        
        // If still no match, use first result
        if (!user && data.users.length > 0) {
          user = data.users[0];
          console.log(`[RequesterInvitationEditor] Using first result as fallback:`, user.name);
        }
        
        if (user) {
          // Get department name from department object if available
          let deptName = "";
          let deptId = null;
          
          if (user.department) {
            if (typeof user.department === 'string') {
              deptName = user.department;
            } else if (user.department.name) {
              deptName = user.department.name;
              deptId = user.department.id;
            }
          }
          
          // Also check departmentCode and department_id directly
          if (!deptName && user.departmentCode) {
            deptName = user.departmentCode;
          }
          if (!deptId && user.department_id) {
            deptId = user.department_id;
          }
          
          // Auto-confirm if requester is the current logged-in user
          const isCurrentUser = currentUserEmail && user.email && 
            user.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
          
          console.log('[RequesterInvitationEditor] 🔍 Checking if requester is current user:', {
            requesterEmail: user.email,
            currentUserEmail: currentUserEmail,
            isCurrentUser: isCurrentUser,
          });
          
          updateRequester(id, {
            name: user.name || userName,
            email: user.email,
            department: deptName || "",
            department_id: deptId,
            user_id: user.id,
            invitationId: isCurrentUser ? 'auto-confirmed' : undefined, // Mark as auto-confirmed if current user
            status: isCurrentUser ? 'confirmed' : 'pending', // Auto-confirm if current user
          });
          
          if (isCurrentUser) {
            toast.success("Requester added", `${user.name || userName} added (auto-confirmed - this is you)`);
          } else {
            toast.success("Requester updated", `${user.name || userName} details loaded`);
          }
        } else {
          // If no user found, just use the name
          updateRequester(id, { name: userName });
          toast.info("User not found", "User details not found. You can still proceed with the name.");
        }
      } else {
        // If no users found, just use the name
        updateRequester(id, { name: userName });
        toast.info("User not found", "User details not found. You can still proceed with the name.");
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Still update with name even if fetch fails
      updateRequester(id, { name: userName });
      toast.warning("Could not fetch details", "User added with name only. You can edit later.");
    } finally {
      setSearchingUser(null);
    }
  };

  // Poll for requester status updates
  const checkRequesterStatus = async () => {
    if (!requestId || !hasSentInvitations) {
      console.log("[RequesterInvitationEditor] ⏭️ Skipping status check:", {
        requestId,
        hasSentInvitations,
      });
      return;
    }

    try {
      console.log("[RequesterInvitationEditor] 🔍 Checking requester status for request:", requestId);
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/requesters/status?request_id=${requestId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        console.error("[RequesterInvitationEditor] ❌ Status API error:", {
          status: response.status,
          statusText: response.statusText,
        });
        return;
      }
      
      const data = await response.json();

      if (data.ok && data.data) {
        console.log("[RequesterInvitationEditor] 📊 Status data received:", {
          count: data.data.length,
          statuses: data.data.map((d: any) => ({ email: d.email, status: d.status, id: d.id })),
        });
        // Only update existing requesters - don't add new ones from database
        // This prevents removed requesters from being restored
        const updatedRequesters = requesters
          .map(req => {
            // Improved matching: case-insensitive email match, or ID match
            const updated = data.data.find((d: any) => {
              // Match by invitation ID (most reliable)
              if (req.invitationId && req.invitationId !== 'auto-confirmed' && d.id === req.invitationId) {
                console.log(`[RequesterInvitationEditor] ✅ Matched by invitation ID: ${req.invitationId}`);
                return true;
              }
              // Match by email (case-insensitive, trimmed)
              if (req.email && d.email) {
                const reqEmail = req.email.toLowerCase().trim();
                const dEmail = d.email.toLowerCase().trim();
                if (reqEmail === dEmail) {
                  console.log(`[RequesterInvitationEditor] ✅ Matched by email: ${reqEmail}`);
                  return true;
                }
              }
              return false;
            });
            if (updated) {
              // Create a unique key for this requester (use invitationId or email)
              const requesterKey = updated.id || req.invitationId || req.email || req.id;
              const previousNotifiedStatus = notifiedStatusRef.current.get(requesterKey);
              
              // Only show toast if status changed AND we haven't notified about this specific status change yet
              if (updated.status !== req.status && updated.status !== previousNotifiedStatus) {
                // Update the notified status map
                notifiedStatusRef.current.set(requesterKey, updated.status);
                
                if (updated.status === 'confirmed') {
                  toast.success("Requester confirmed", `${updated.name || updated.email} has confirmed their participation`);
                } else if (updated.status === 'declined') {
                  toast.info("Requester declined", `${updated.name || updated.email} has declined the invitation`);
                }
              }
              
              // Always update with latest data (name, department, signature, etc.)
              // Prefer database values over local state for confirmed requesters
              return { 
                ...req, 
                status: updated.status,
                // Use database name if available, otherwise keep local
                name: updated.name || req.name,
                // Use database department if available, otherwise keep local
                department: updated.department || req.department,
                department_id: updated.department_id || req.department_id,
                // Use database signature if available (even if null, to clear old signature)
                // Only keep local signature if database doesn't have one yet
                signature: updated.status === 'confirmed' 
                  ? (updated.signature !== undefined ? updated.signature : req.signature)
                  : (updated.signature || req.signature),
                invitationId: updated.id || req.invitationId,
              };
            }
            return req;
          })
          // Filter out requesters that were removed (exist in local state but not in database)
          // Only if they have an invitationId (were saved to database)
          .filter(req => {
            if (req.invitationId && req.invitationId !== 'auto-confirmed') {
              const existsInDb = data.data.some((d: any) => {
                // Match by ID
                if (d.id === req.invitationId) return true;
                // Match by email (case-insensitive)
                if (req.email && d.email) {
                  return req.email.toLowerCase().trim() === d.email.toLowerCase().trim();
                }
                return false;
              });
              // If it was in database but now removed, filter it out
              return existsInDb;
            }
            // Keep requesters without invitationId (not yet saved to database)
            return true;
          });

        // Only update if there are changes (to avoid unnecessary re-renders)
        // Check for changes in status, invitationId, name, department, or signature
        const hasChanges = updatedRequesters.length !== requesters.length ||
          updatedRequesters.some((req, idx) => {
            const old = requesters[idx];
            if (!old) return true;
            return (
              req.status !== old.status ||
              req.invitationId !== old.invitationId ||
              req.name !== old.name ||
              req.department !== old.department ||
              req.signature !== old.signature
            );
          });
        
        if (hasChanges) {
          console.log("[RequesterInvitationEditor] 🔄 Status update detected, updating requesters:", {
            before: requesters.map(r => ({ 
              email: r.email, 
              status: r.status, 
              invitationId: r.invitationId,
              name: r.name,
              department: r.department,
              hasSignature: !!r.signature,
            })),
            after: updatedRequesters.map(r => ({ 
              email: r.email, 
              status: r.status, 
              invitationId: r.invitationId,
              name: r.name,
              department: r.department,
              hasSignature: !!r.signature,
            }))
          });
          onChange(updatedRequesters);
        } else {
          console.log("[RequesterInvitationEditor] ⏭️ No changes detected, skipping update");
        }
      }
    } catch (err) {
      console.error("[RequesterInvitationEditor] Error checking requester status:", err);
    }
  };

  const startPolling = () => {
    if (pollingInterval) {
      console.log("[RequesterInvitationEditor] ⏭️ Already polling, skipping start");
      return; // Already polling
    }

    // Poll every 3 seconds for faster updates
    const interval = setInterval(() => {
      console.log("[RequesterInvitationEditor] 🔄 Polling interval triggered");
      checkRequesterStatus();
    }, 3000);
    setPollingInterval(interval);
    console.log("[RequesterInvitationEditor] ✅ Started polling for requester status updates (every 3s)");
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      console.log("[RequesterInvitationEditor] ⏹️ Stopped polling for requester status updates");
    }
  };

  // Cooldown countdown timer
  React.useEffect(() => {
    if (lastSendTime === null) {
      setCooldownRemaining(0);
      return;
    }

    const elapsed = Date.now() - lastSendTime;
    const remaining = Math.max(0, COOLDOWN_DURATION - elapsed);
    setCooldownRemaining(remaining);

    if (remaining > 0) {
      const interval = setInterval(() => {
        const newElapsed = Date.now() - lastSendTime;
        const newRemaining = Math.max(0, COOLDOWN_DURATION - newElapsed);
        setCooldownRemaining(newRemaining);
        
        if (newRemaining === 0) {
          clearInterval(interval);
        }
      }, 100); // Update every 100ms for smooth countdown

      return () => clearInterval(interval);
    }
  }, [lastSendTime, COOLDOWN_DURATION]);

  // Start polling when component mounts if there are sent invitations
  React.useEffect(() => {
    if (requestId && hasSentInvitations && !pollingInterval) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, hasSentInvitations]);

  const sendInvitation = async (requester: RequesterInvitation) => {
    if (!requester.email) {
      toast.error("No email", "Please select a user with an email address");
      return;
    }

    // Check cooldown
    if (cooldownRemaining > 0) {
      const secondsLeft = Math.ceil(cooldownRemaining / 1000);
      toast.warning("Please wait", `Please wait ${secondsLeft} second${secondsLeft > 1 ? 's' : ''} before sending another invitation.`);
      return;
    }

    // Auto-save draft if requestId doesn't exist (data is already persisted)
    let finalRequestId = requestId;
    if (!finalRequestId && onAutoSaveRequest) {
      try {
        setSending(requester.id);
        toast.info("Saving draft...", "Creating draft to enable invitation sending...");
        
        const savedId = await onAutoSaveRequest();
        finalRequestId = savedId || undefined;
        
        if (!finalRequestId) {
          throw new Error("Draft created but no request ID returned");
        }
        
        toast.success("Draft saved", "Draft created successfully. Sending invitation...");
      } catch (err: any) {
        console.error('[RequesterInvitationEditor] Error auto-saving draft:', err);
        toast.error("Failed to save draft", err.message || "Please save the request as draft first, then try sending invitations again.");
        setSending(null);
        return;
      }
    } else if (!finalRequestId) {
      toast.info("Save request first", "Please save the request as draft first, then you can send invitations.");
      setSending(null);
      return;
    }

    setSending(requester.id);
    setLastSendTime(Date.now()); // Start cooldown
    try {
      const response = await fetch('/api/requesters/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: finalRequestId,
          email: requester.email,
          requester_id: requester.user_id,
          name: requester.name,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        updateRequester(requester.id, {
          invitationId: data.data?.id,
          status: 'pending',
        });
        toast.success("Invitation sent", `Invitation sent to ${requester.email}`);
        
        // Start polling for status updates if not already started
        if (requestId && !pollingInterval) {
          startPolling();
        }
        // Also do an immediate check after sending invitation
        if (requestId) {
          // Check immediately, then again after delays to catch confirmations
          checkRequesterStatus();
          setTimeout(() => {
            checkRequesterStatus();
          }, 2000); // Check after 2 seconds
          setTimeout(() => {
            checkRequesterStatus();
          }, 5000); // Check after 5 seconds
        }
        
        if (data.confirmationLink) {
          setLinkToShow({ email: requester.email, link: data.confirmationLink });
          setShowLinkModal(true);
        }
      } else {
        toast.error("Failed to send", data.error || "Could not send invitation");
        if (data.confirmationLink) {
          // Still show link even if email failed
          setLinkToShow({ email: requester.email, link: data.confirmationLink });
          setShowLinkModal(true);
        }
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast.error("Error", error.message || "Failed to send invitation");
    } finally {
      setSending(null);
    }
  };

  const sendAllInvitations = async () => {
    if (pendingInvitations.length === 0) {
      toast.info("No pending invitations", "All requesters have been invited");
      return;
    }

    // Check cooldown
    if (cooldownRemaining > 0) {
      const secondsLeft = Math.ceil(cooldownRemaining / 1000);
      toast.warning("Please wait", `Please wait ${secondsLeft} second${secondsLeft > 1 ? 's' : ''} before sending invitations again.`);
      return;
    }

    // Auto-save draft if requestId doesn't exist
    let finalRequestId = requestId;
    if (!finalRequestId && onAutoSaveRequest) {
      try {
        setSendingAll(true);
        toast.info("Saving draft...", "Creating draft to enable invitation sending...");
        
        const savedId = await onAutoSaveRequest();
        finalRequestId = savedId || undefined;
        
        if (!finalRequestId) {
          throw new Error("Draft created but no request ID returned");
        }
        
        toast.success("Draft saved", "Draft created successfully. Sending invitations...");
      } catch (err: any) {
        console.error('[RequesterInvitationEditor] Error auto-saving draft:', err);
        toast.error("Failed to save draft", err.message || "Please save the request as draft first, then try sending invitations again.");
        setSendingAll(false);
        return;
      }
    } else if (!finalRequestId) {
      toast.info("Save request first", "Please save the request as draft first, then you can send invitations.");
      setSendingAll(false);
      return;
    }

    setSendingAll(true);
    setLastSendTime(Date.now()); // Start cooldown
    try {
      const promises = pendingInvitations
        .filter(req => req.email)
        .map(req => sendInvitation(req));
      
      await Promise.all(promises);
      toast.success("Invitations sent", `Sent ${pendingInvitations.length} invitation(s)`);
      
      // Start polling for status updates if not already started
      if (requestId && !pollingInterval) {
        startPolling();
      }
      // Also do an immediate check after sending invitations
      if (requestId) {
        // Check immediately, then again after delays to catch confirmations
        checkRequesterStatus();
        setTimeout(() => {
          checkRequesterStatus();
        }, 2000); // Check after 2 seconds
        setTimeout(() => {
          checkRequesterStatus();
        }, 5000); // Check after 5 seconds
      }
    } catch (error: any) {
      console.error('Failed to send all invitations:', error);
      toast.error("Error", "Some invitations failed to send");
    } finally {
      setSendingAll(false);
    }
  };

  const copyLink = () => {
    if (linkToShow) {
      navigator.clipboard.writeText(linkToShow.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied", "Confirmation link copied to clipboard");
    }
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'expired') {
      return <Clock className="h-3.5 w-3.5 text-amber-600" />;
    }
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Confirmed</span>;
      case 'declined':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Declined</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Not invited</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Requesting Persons</h3>
          <p className="text-sm text-gray-600 mt-1">
            {requesterRole === "head" 
              ? "Add yourself and other faculty/heads who will be part of this request"
              : "Add faculty members who will be part of this request"}
          </p>
          {requesterRole === "head" && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: As a head, you can add multiple requesters from different departments
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {requestId && hasSentInvitations && (
            <button
              type="button"
              onClick={() => {
                console.log("[RequesterInvitationEditor] 🔄 Manual refresh triggered");
                checkRequesterStatus();
              }}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              title="Refresh status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
          <button
            type="button"
            onClick={addRequesterSlot}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7A0010] text-white hover:bg-[#5e000d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Requester
          </button>
        </div>
      </div>

      {/* Requester Slots */}
      <div className="space-y-3">
        {requesters.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No requesters added yet</p>
            <p className="text-xs text-gray-500 mt-1">Click "Add Requester" to add requesting persons</p>
          </div>
        ) : (
          requesters.map((requester, index) => (
            <div
              key={requester.id}
              className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-[#7A0010]/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Requester Number */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Requester #{index + 1}</span>
                    {getStatusBadge(requester.status)}
                  </div>

                  {/* User Search */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Search and Select {requesterRole === "faculty" ? "Faculty" : "Head"} <span className="text-red-500">*</span>
                    </label>
                    <UserSearchableSelect
                      value={requester.name || ""}
                      onChange={(userName) => handleUserSelect(requester.id, userName)}
                      placeholder={`Type to search ${requesterRole}...`}
                      label=""
                      required
                      className="w-full"
                    />
                    {searchingUser === requester.id && (
                      <p className="text-xs text-gray-500 mt-1">Loading user details...</p>
                    )}
                  </div>

                  {/* Auto-filled Info */}
                  {requester.name && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {requester.email && (
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-500 block mb-1">Email:</span>
                          <p className="text-gray-900 break-words" title={requester.email}>{requester.email}</p>
                        </div>
                      )}
                      {requester.department && (
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-500 block mb-1">Department:</span>
                          <p className="text-gray-900 break-words" title={requester.department}>{requester.department}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send/Resend Invitation Button - Don't show if requester is current user (auto-confirmed) */}
                  {requester.name && requester.email && 
                   !(currentUserEmail && requester.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sendInvitation(requester)}
                        disabled={disabled || sending === requester.id || cooldownRemaining > 0}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        title={cooldownRemaining > 0 ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again` : undefined}
                      >
                        {sending === requester.id ? (
                          <>
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : cooldownRemaining > 0 ? (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            Wait {Math.ceil(cooldownRemaining / 1000)}s
                          </>
                        ) : requester.invitationId ? (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Resend Invitation
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Send Email Invitation
                          </>
                        )}
                      </button>
                      {requester.invitationId && requester.invitationId !== 'auto-confirmed' && (
                        <span className="text-xs text-gray-500">
                          (Invitation sent)
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Auto-confirmed badge for current user */}
                  {requester.name && requester.email && 
                   currentUserEmail && 
                   requester.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim() && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Auto-confirmed (This is you)</span>
                    </div>
                  )}

                  {/* Invitation Status */}
                  {requester.invitationId && requester.invitationId !== 'auto-confirmed' && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(requester.status)}
                      <span className="text-gray-700">
                        Invitation {
                          requester.status === 'confirmed' ? 'confirmed' : 
                          requester.status === 'declined' ? 'declined' : 
                          requester.status === 'expired' ? 'expired' : 
                          'sent'
                        }
                      </span>
                    </div>
                  )}

                  {/* Expired Invitation Warning */}
                  {requester.status === 'expired' && requester.invitationId && requester.invitationId !== 'auto-confirmed' && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-amber-800 font-medium mb-1">Invitation Expired</p>
                          <p className="text-xs text-amber-700">The invitation link has expired. Click "Resend Invitation" to send a new link.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature Display - Show when confirmed */}
                  {requester.status === 'confirmed' && requester.signature && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Signature Confirmed</span>
                      </div>
                      <img 
                        src={requester.signature} 
                        alt="Requester signature" 
                        className="w-full max-w-xs h-20 object-contain border border-green-300 rounded bg-white"
                      />
                    </div>
                  )}

                  {/* Resend Button for Expired Invitations */}
                  {requester.status === 'expired' && requester.invitationId && requester.invitationId !== 'auto-confirmed' && requester.email && !disabled && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => sendInvitation(requester)}
                        disabled={sending === requester.id || cooldownRemaining > 0}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        title={cooldownRemaining > 0 ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again` : undefined}
                      >
                        {sending === requester.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                            Resending...
                          </>
                        ) : cooldownRemaining > 0 ? (
                          <>
                            <Clock className="h-4 w-4" />
                            Wait {Math.ceil(cooldownRemaining / 1000)}s
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Resend Invitation
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Remove Button - Always show (user can remove any requester) */}
                <button
                  type="button"
                  onClick={() => removeRequester(requester.id)}
                  disabled={disabled}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Remove requester"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send All Button */}
      {hasPendingInvitations && requesters.length > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={sendAllInvitations}
            disabled={disabled || sendingAll || cooldownRemaining > 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A0010] text-white hover:bg-[#5e000d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={cooldownRemaining > 0 ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again` : undefined}
          >
            {sendingAll ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Sending all...
              </>
            ) : cooldownRemaining > 0 ? (
              <>
                <Clock className="h-4 w-4" />
                Wait {Math.ceil(cooldownRemaining / 1000)}s
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send All Invitations ({pendingInvitations.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Info Message */}
      {requesters.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Search and select {requesterRole === "faculty" ? "faculty members" : "heads"} who will be part of this request</li>
              <li>Department will be auto-filled based on selected person</li>
              <li>Send email invitation to each requester for confirmation</li>
              <li>Requesters need to confirm before the request can be submitted</li>
            </ul>
          </div>
        </div>
      )}

      {/* Link Modal - Premium Redesigned UI */}
      {showLinkModal && linkToShow && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title=""
          size="lg"
        >
          <div className="space-y-6 p-2">
            {/* Premium Header with Enhanced Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7A0010] via-[#8a0015] to-[#5e000d] p-6 shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
              
              <div className="relative flex items-center gap-5">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
                    <Mail className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Confirmation Link</h3>
                  <div className="flex items-center gap-2.5">
                    <div className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Recipient</span>
                    </div>
                    <span className="text-sm font-semibold text-white/95 truncate bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                      {linkToShow.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link Input Section - Premium Design */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-800">
                  Confirmation URL
                </label>
                <span className="text-xs text-gray-500 font-medium">Click to select all</span>
              </div>
              <div className="group relative">
                <div className="relative flex items-stretch gap-0 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 group-hover:border-[#7A0010]/50 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden ring-1 ring-gray-100">
                  <div className="flex-1 min-w-0 p-5 bg-transparent">
                    <input
                      type="text"
                      value={linkToShow.link}
                      readOnly
                      className="w-full text-sm font-mono text-gray-900 bg-transparent border-none outline-none break-all cursor-text select-all placeholder:text-gray-400"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div className="flex-shrink-0 w-px h-auto bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 my-3" />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`flex-shrink-0 px-7 py-5 font-bold text-sm transition-all duration-300 flex items-center gap-2.5 shadow-lg ${
                      copied
                        ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transform hover:scale-[1.02]"
                        : "bg-gradient-to-r from-[#7A0010] via-[#8a0015] to-[#5e000d] text-white hover:from-[#8a0015] hover:via-[#7A0010] hover:to-[#6a0010] transform hover:scale-[1.02]"
                    }`}
                    title={copied ? "Copied to clipboard!" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" strokeWidth={3} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" strokeWidth={2.5} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section - Premium Enhanced Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/80 to-purple-50/60 border-2 border-blue-200/60 shadow-xl">
              {/* Animated decorative background elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-200/40 to-indigo-200/30 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-200/30 to-purple-200/20 rounded-full -ml-20 -mb-20 blur-2xl" />
              
              <div className="relative p-6">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg ring-2 ring-blue-200/50">
                      <AlertCircle className="h-7 w-7 text-blue-600" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                        Manual Sharing Instructions
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        If the email invitation wasn't received, you can copy and share this confirmation link directly with the recipient. The link will remain valid for <span className="font-bold text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded-md">7 days</span> from the time it was generated.
                      </p>
                    </div>
                    <div className="pt-4 border-t-2 border-blue-200/60">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-100/60 px-3 py-1.5 rounded-lg">Recipient Email</span>
                        <span className="text-sm font-bold text-blue-900 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm border border-blue-200/50">{linkToShow.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button - Premium Design */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-10 py-3.5 text-sm font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg min-w-[140px] transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

