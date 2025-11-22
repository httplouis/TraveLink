// src/components/user/request/ui/HeadEndorsementInvitationEditor.tsx
"use client";

import * as React from "react";
import { Mail, CheckCircle2, XCircle, Clock, Send, Building2, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";

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
}

export default function HeadEndorsementInvitationEditor({
  heads,
  onChange,
  requestId,
  disabled = false,
  onStatusChange,
  currentUserEmail,
}: HeadEndorsementInvitationEditorProps) {
  const [sending, setSending] = React.useState<string | null>(null); // head ID being sent
  const [sendingAll, setSendingAll] = React.useState(false);
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null);
  const toast = useToast();

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

    // Poll immediately, then every 5 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestId, hasSentInvitations, disabled, heads, onChange]);

  const sendInvitation = async (headId: string) => {
    if (!requestId) {
      toast.error("Save request first", "Please save the request as draft first, then you can send head endorsement invitations. The request ID is needed to link the invitations.");
      return;
    }

    const head = heads.find(h => h.id === headId);
    if (!head || !head.head_email) {
      toast.error("Missing information", "Head email is required to send invitation.");
      return;
    }

    setSending(headId);
    try {
      const response = await fetch('/api/head-endorsements/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          head_email: head.head_email,
          head_name: head.head_name,
          department_id: head.department_id,
          department_name: head.department_name,
        }),
      });

      const data = await response.json();

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

      toast.success("Invitation sent", `Email invitation sent to ${head.head_name || head.head_email}`);
    } catch (err: any) {
      console.error('[HeadEndorsementInvitationEditor] Error sending invitation:', err);
      toast.error("Failed to send", err.message || "Please try again.");
    } finally {
      setSending(null);
    }
  };

  const sendAllInvitations = async () => {
    if (!requestId) {
      toast.error("Save request first", "Please save the request as draft first, then you can send head endorsement invitations.");
      return;
    }

    const toSend = pendingInvitations.filter(h => h.head_email);
    if (toSend.length === 0) {
      toast.info("No invitations to send", "All head endorsement invitations have already been sent.");
      return;
    }

    setSendingAll(true);
    try {
      const results = await Promise.allSettled(
        toSend.map(head => 
          fetch('/api/head-endorsements/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: requestId,
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

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      if (successCount === toSend.length) {
        toast.success("All invitations sent", `Sent ${successCount} head endorsement invitation(s)`);
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
                    disabled={!requestId || sending === head.id}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending === head.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
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
          {requestId && (
            <button
              onClick={sendAllInvitations}
              disabled={sendingAll || pendingInvitations.filter(h => h.head_email).length === 0}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send All Invitations ({pendingInvitations.filter(h => h.head_email).length})
                </>
              )}
            </button>
          )}
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
    </div>
  );
}

