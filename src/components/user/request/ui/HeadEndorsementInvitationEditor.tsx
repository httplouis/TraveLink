// src/components/user/request/ui/HeadEndorsementInvitationEditor.tsx
"use client";

import * as React from "react";
import { Mail, CheckCircle2, XCircle, Clock, Send, Building2, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import Modal from "@/components/common/Modal";

// Utility function to replace localhost URLs with production URL
function sanitizeUrl(url: string): string {
  if (!url) return url;
  
  // Check if URL contains localhost
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // ALWAYS use production URL for email links (even in local dev)
    // This ensures links work when shared via email
    const productionUrl = 'https://travilink.vercel.app';
    
    // Replace localhost with production URL
    const sanitized = url.replace(/https?:\/\/[^/]+/, productionUrl.replace(/\/$/, ''));
    console.log('[HeadEndorsementInvitationEditor] 🔄 Sanitized URL:', { original: url, sanitized });
    return sanitized;
  }
  
  return url;
}

interface HeadEndorsementInvitation {
  id: string; // Unique ID for this head slot
  head_name: string; // Head's name
  head_email?: string; // Head's email
  department_name: string; // Department name
  department_id?: string; // Department ID
  head_user_id?: string; // Head user ID from database
  status?: 'pending' | 'sent' | 'confirmed' | 'declined' | 'expired';
  invitationId?: string; // ID from database after sending invitation
  signature?: string; // Base64 signature (if confirmed)
  confirmed_at?: string; // When head confirmed
}

interface HeadEndorsementInvitationEditorProps {
  heads: HeadEndorsementInvitation[];
  onChange: (heads: HeadEndorsementInvitation[]) => void;
  requestId?: string; // For sending invitations (after request is saved as draft)
  disabled?: boolean; // Disable when request is submitted
  onStatusChange?: (allConfirmed: boolean) => void; // Callback when status changes
  currentUserEmail?: string; // Current user's email for auto-confirmation
  onAutoSaveRequest?: () => Promise<string | null>; // Callback to auto-save draft and return requestId
}

export default function HeadEndorsementInvitationEditor({
  heads,
  onChange,
  requestId,
  disabled = false,
  onStatusChange,
  currentUserEmail,
  onAutoSaveRequest,
}: HeadEndorsementInvitationEditorProps) {
  const [sending, setSending] = React.useState<string | null>(null); // head ID being sent
  const [sendingAll, setSendingAll] = React.useState(false);
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null);
  const toast = useToast();
  
  // Confirmation link modal state
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [linkToShow, setLinkToShow] = React.useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  
  // Cooldown state (10 seconds)
  const [lastSendTime, setLastSendTime] = React.useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = React.useState(0);
  const COOLDOWN_DURATION = 10000; // 10 seconds in milliseconds

  // Auto-confirm heads who are the current user
  React.useEffect(() => {
    if (currentUserEmail && heads.length > 0) {
      const updatedHeads = heads.map(head => {
        if (head.head_email && head.head_email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()) {
          if (head.status !== 'confirmed') {
            console.log(`[HeadEndorsementInvitationEditor] ✅ Auto-confirming head ${head.head_name} (current user)`);
            return {
              ...head,
              status: 'confirmed' as const,
              invitationId: head.invitationId || 'auto-confirmed',
              confirmed_at: new Date().toISOString(),
            };
          }
        }
        return head;
      });

      // Check if any head was auto-confirmed
      const hasChanges = updatedHeads.some((updated, idx) => 
        updated.status !== heads[idx].status
      );

      if (hasChanges) {
        onChange(updatedHeads);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail, heads.length]); // Only depend on currentUserEmail and heads length

  // Check if all heads are confirmed
  const allConfirmed = heads.length > 0 && heads.every(head => head.status === 'confirmed');
  const hasPendingInvitations = heads.some(head => !head.invitationId && head.status !== 'confirmed');
  const hasSentInvitations = heads.some(head => head.invitationId);
  const pendingInvitations = heads.filter(head => !head.invitationId && head.status !== 'confirmed');

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
      }, 100);
    }
  }, [allConfirmed]);

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

  // Poll for status updates if invitations were sent
  React.useEffect(() => {
    if (!requestId || !hasSentInvitations || disabled) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/head-endorsements/status?request_id=${requestId}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await response.json();

        if (data.ok && data.data) {
          // Update heads with latest status from database
          const updatedHeads = heads.map(head => {
            const dbInvitation = data.data.find((inv: any) => 
              inv.head_email?.toLowerCase() === head.head_email?.toLowerCase() ||
              inv.head_user_id === head.head_user_id ||
              inv.department_id === head.department_id
            );
            
            if (dbInvitation) {
              return {
                ...head,
                status: dbInvitation.status,
                invitationId: dbInvitation.id,
                signature: dbInvitation.signature,
                confirmed_at: dbInvitation.confirmed_at,
              };
            }
            return head;
          });

          // Only update if there are changes
          const hasChanges = updatedHeads.some((updated, idx) => 
            updated.status !== heads[idx].status ||
            updated.invitationId !== heads[idx].invitationId
          );

          if (hasChanges) {
            onChange(updatedHeads);
          }
        }
      } catch (err) {
        console.error('[HeadEndorsementInvitationEditor] Error polling status:', err);
      }
    };

    // OPTIMIZED: Reduced frequency from 5s to 30s to minimize egress
    pollStatus();
    const interval = setInterval(pollStatus, 30000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestId, hasSentInvitations, disabled, heads, onChange]);

  const sendInvitation = async (headId: string) => {
    // Check cooldown
    if (cooldownRemaining > 0) {
      const secondsLeft = Math.ceil(cooldownRemaining / 1000);
      toast.warning("Please wait", `Please wait ${secondsLeft} second${secondsLeft > 1 ? 's' : ''} before sending another invitation.`);
      return;
    }

    const head = heads.find(h => h.id === headId);
    if (!head || !head.head_email) {
      toast.error("Missing information", "Head email is required to send invitation.");
      return;
    }

    // Auto-save draft silently if requestId doesn't exist (data is already persisted)
    let finalRequestId = requestId;
    if (!finalRequestId && onAutoSaveRequest) {
      try {
        setSending(headId);
        // Silent auto-save - no toast notifications since data is already persisted
        finalRequestId = await onAutoSaveRequest();
        
        if (!finalRequestId) {
          throw new Error("Draft created but no request ID returned");
        }
      } catch (err: any) {
        console.error('[HeadEndorsementInvitationEditor] Error auto-saving draft:', err);
        toast.error("Failed to send invitation", err.message || "Unable to send invitation. Please try again.");
        setSending(null);
        return;
      }
    } else if (!finalRequestId) {
      toast.error("Unable to send", "Please ensure the request form is filled out correctly.");
      setSending(null);
      return;
    }

    setSending(headId);
    setLastSendTime(Date.now()); // Start cooldown
    try {
      const response = await fetch('/api/head-endorsements/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: finalRequestId,
          head_email: head.head_email,
          head_name: head.head_name,
          department_id: head.department_id,
          department_name: head.department_name,
        }),
      });

      const data = await response.json();

      console.log('[HeadEndorsementInvitationEditor] API Response:', {
        ok: data.ok,
        hasConfirmationLink: !!data.confirmationLink,
        confirmationLink: data.confirmationLink?.substring(0, 50) + '...',
        emailSent: data.emailSent,
      });

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      // Update head with invitation ID
      const updatedHeads = heads.map(h => 
        h.id === headId 
          ? { ...h, invitationId: data.data.id, status: 'sent' as const }
          : h
      );
      onChange(updatedHeads);

      // Always show confirmation link modal if available (for manual sharing)
      if (data.confirmationLink) {
        const sanitizedLink = sanitizeUrl(data.confirmationLink);
        console.log('[HeadEndorsementInvitationEditor] Showing confirmation link modal:', {
          email: head.head_email,
          originalLink: data.confirmationLink.substring(0, 50) + '...',
          sanitizedLink: sanitizedLink.substring(0, 50) + '...',
        });
        setLinkToShow({ email: head.head_email || '', link: sanitizedLink });
        setShowLinkModal(true);
      } else {
        console.warn('[HeadEndorsementInvitationEditor] No confirmation link in response');
      }

      if (data.emailSent) {
        toast.success("Invitation sent", `Email invitation sent to ${head.head_name || head.head_email}. Confirmation link is available for manual sharing.`);
      } else if (data.confirmationLink) {
        toast.warning("Email failed", `Email could not be sent. Confirmation link is available for manual sharing.`);
      } else {
        toast.success("Invitation sent", `Email invitation sent to ${head.head_name || head.head_email}`);
      }
    } catch (err: any) {
      console.error('[HeadEndorsementInvitationEditor] Error sending invitation:', err);
      toast.error("Failed to send", err.message || "Please try again.");
      // Show link even on error if available
      if (err.confirmationLink) {
        const sanitizedLink = sanitizeUrl(err.confirmationLink);
        setLinkToShow({ email: head.head_email || '', link: sanitizedLink });
        setShowLinkModal(true);
      }
    } finally {
      setSending(null);
    }
  };

  const copyLink = async () => {
    if (!linkToShow) return;
    try {
      await navigator.clipboard.writeText(linkToShow.link);
      setCopied(true);
      toast.success("Link copied", "Confirmation link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error("Failed to copy", "Could not copy link to clipboard");
    }
  };

  const sendAllInvitations = async () => {
    // Check cooldown
    if (cooldownRemaining > 0) {
      const secondsLeft = Math.ceil(cooldownRemaining / 1000);
      toast.warning("Please wait", `Please wait ${secondsLeft} second${secondsLeft > 1 ? 's' : ''} before sending invitations again.`);
      return;
    }

    const toSend = pendingInvitations.filter(h => h.head_email);
    if (toSend.length === 0) {
      toast.info("No invitations to send", "All head endorsement invitations have already been sent.");
      return;
    }

    // Auto-save draft silently if requestId doesn't exist (data is already persisted)
    let finalRequestId = requestId;
    if (!finalRequestId && onAutoSaveRequest) {
      try {
        setSendingAll(true);
        // Silent auto-save - no toast notifications since data is already persisted
        finalRequestId = await onAutoSaveRequest();
        
        if (!finalRequestId) {
          throw new Error("Draft created but no request ID returned");
        }
      } catch (err: any) {
        console.error('[HeadEndorsementInvitationEditor] Error auto-saving draft:', err);
        toast.error("Failed to send invitations", err.message || "Unable to send invitations. Please try again.");
        setSendingAll(false);
        return;
      }
    } else if (!finalRequestId) {
      toast.error("Unable to send", "Please ensure the request form is filled out correctly.");
      setSendingAll(false);
      return;
    }

    setSendingAll(true);
    setLastSendTime(Date.now()); // Start cooldown
    try {
      const results = await Promise.allSettled(
        toSend.map(head => 
          fetch('/api/head-endorsements/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: finalRequestId,
              head_email: head.head_email,
              head_name: head.head_name,
              department_id: head.department_id,
              department_name: head.department_name,
            }),
          }).then(r => r.json())
        )
      );

      const updatedHeads = heads.map(head => {
        const result = results.find((_, idx) => toSend[idx]?.id === head.id);
        if (result && result.status === 'fulfilled' && result.value.ok) {
          return { ...head, invitationId: result.value.data.id, status: 'sent' as const };
        }
        return head;
      });
      onChange(updatedHeads);

      // Show confirmation link for the first successful invitation (or first one with a link)
      const firstSuccess = results.find(r => r.status === 'fulfilled' && r.value.ok && r.value.confirmationLink);
      if (firstSuccess && firstSuccess.status === 'fulfilled') {
        const firstHead = toSend[0];
        const sanitizedLink = sanitizeUrl(firstSuccess.value.confirmationLink);
        setLinkToShow({ email: firstHead.head_email || '', link: sanitizedLink });
        setShowLinkModal(true);
      }

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      if (successCount === toSend.length) {
        toast.success("All invitations sent", `Sent ${successCount} head endorsement invitation(s). Confirmation links are available for manual sharing.`);
      } else {
        toast.warning("Some invitations failed", `${successCount} of ${toSend.length} invitations sent successfully.`);
      }
    } catch (err: any) {
      console.error('[HeadEndorsementInvitationEditor] Error sending all invitations:', err);
      toast.error("Failed to send", err.message || "Please try again.");
    } finally {
      setSendingAll(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'sent':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Mail className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Confirmed</span>;
      case 'sent':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>;
      case 'declined':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Declined</span>;
      case 'expired':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Expired</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Not Sent</span>;
    }
  };

  if (heads.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-3 border-b-2 border-blue-200 pb-3">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Department Head Endorsements</h3>
          <p className="text-sm text-gray-600">
            {allConfirmed 
              ? 'All department heads have endorsed' 
              : `${heads.filter(h => h.status === 'confirmed').length} of ${heads.length} heads have endorsed`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {heads.map((head, index) => (
          <div
            key={head.id}
            className={`rounded-lg border-2 p-4 ${
              head.status === 'confirmed'
                ? 'bg-green-50 border-green-200'
                : head.status === 'sent'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(head.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-900">
                      Head #{index + 1}: {head.head_name}
                    </p>
                    {getStatusBadge(head.status)}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {head.department_name}
                  </p>
                  {head.head_email && (
                    <p className="text-xs text-gray-500 mb-2">
                      {head.head_email}
                    </p>
                  )}
                  {head.status === 'confirmed' && head.confirmed_at && (
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Confirmed on {new Date(head.confirmed_at).toLocaleDateString()}
                    </p>
                  )}
                  {head.status === 'sent' && (
                    <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Invitation sent, awaiting response
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {!head.invitationId && head.head_email && !disabled && (
                  <button
                    onClick={() => sendInvitation(head.id)}
                    disabled={sending === head.id || cooldownRemaining > 0}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={cooldownRemaining > 0 ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again` : undefined}
                  >
                    {sending === head.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : cooldownRemaining > 0 ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Wait {Math.ceil(cooldownRemaining / 1000)}s
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Email Invitation
                      </>
                    )}
                  </button>
                )}
                {!head.head_email && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Head email not found
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingInvitations.length > 0 && !disabled && (
        <div className="mt-4 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              {pendingInvitations.length} head endorsement invitation{pendingInvitations.length > 1 ? 's' : ''} not yet sent
            </p>
          </div>
          <button
            onClick={sendAllInvitations}
            disabled={sendingAll || pendingInvitations.filter(h => h.head_email).length === 0 || cooldownRemaining > 0}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={cooldownRemaining > 0 ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again` : undefined}
          >
              {sendingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Wait {Math.ceil(cooldownRemaining / 1000)}s
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send All Invitations ({pendingInvitations.filter(h => h.head_email).length})
                </>
              )}
            </button>
        </div>
      )}

      {!allConfirmed && hasSentInvitations && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Waiting for {heads.filter(h => h.status === 'sent' || h.status === 'pending').length} head endorsement{heads.filter(h => h.status === 'sent' || h.status === 'pending').length > 1 ? 's' : ''} before you can submit this request.
          </p>
        </div>
      )}

      {/* Link Modal - Same design as RequesterInvitationEditor */}
      {showLinkModal && linkToShow && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setCopied(false);
          }}
          title=""
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmation Link</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipient</span>
                  <span className="text-sm font-semibold text-[#7A0010] truncate">{linkToShow.email}</span>
                </div>
              </div>
            </div>

            {/* Link Input Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Confirmation URL
              </label>
              <div className="group relative">
                <div className="relative flex items-stretch gap-0 bg-white rounded-xl border-2 border-gray-200 hover:border-[#7A0010]/40 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden">
                  <div className="flex-1 min-w-0 p-4">
                    <input
                      type="text"
                      value={linkToShow.link}
                      readOnly
                      className="w-full text-sm font-mono text-gray-800 bg-transparent border-none outline-none break-all cursor-text select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div className="flex-shrink-0 w-px h-auto bg-gray-200 my-2" />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`flex-shrink-0 px-6 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                      copied
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        : "bg-gradient-to-r from-[#7A0010] to-[#5e000d] text-white hover:from-[#8a0015] hover:to-[#7A0010]"
                    }`}
                    title={copied ? "Copied to clipboard!" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Click the URL to select all</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50/50 border border-blue-200/80 shadow-sm">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/40 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/30 rounded-full -ml-16 -mb-16 blur-2xl" />
              
              <div className="relative p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-blue-900 mb-2.5 flex items-center gap-2">
                      Manual Sharing Instructions
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed mb-4">
                      If the email invitation wasn't received, you can copy and share this confirmation link directly with the recipient. The link will remain valid for <span className="font-bold text-blue-900">7 days</span> from the time it was generated.
                    </p>
                    <div className="pt-3 border-t border-blue-200/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Recipient Email</span>
                        <span className="text-xs font-bold text-blue-900 bg-blue-100/50 px-2 py-1 rounded-md">{linkToShow.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setCopied(false);
                }}
                className="px-8 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md min-w-[120px]"
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

