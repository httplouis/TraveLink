// src/components/user/request/ui/ParticipantInvitationEditor.tsx
"use client";

import * as React from "react";
import { Mail, CheckCircle2, XCircle, Clock, Send, UserPlus, AlertCircle, Copy, Check } from "lucide-react";
import { TextInput } from "./controls";
import { useToast } from "@/components/common/ui/Toast";
import Modal from "@/components/common/Modal";

interface ParticipantInvitation {
  email: string;
  name?: string;
  department?: string;
  availableFdp?: number | null;
  status?: 'pending' | 'confirmed' | 'declined';
  invitationId?: string; // ID from database after sending
}

interface ParticipantInvitationEditorProps {
  invitations: ParticipantInvitation[];
  onChange: (invitations: ParticipantInvitation[]) => void;
  requestId?: string; // For sending invitations
  disabled?: boolean; // Disable when request is submitted
  onStatusChange?: (allConfirmed: boolean) => void; // Callback when status changes
}

export default function ParticipantInvitationEditor({
  invitations,
  onChange,
  requestId,
  disabled = false,
  onStatusChange,
}: ParticipantInvitationEditorProps) {
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [linkToShow, setLinkToShow] = React.useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();
  const [sending, setSending] = React.useState<string | null>(null); // email being sent
  const [sendingAll, setSendingAll] = React.useState(false);
  const [emailFields, setEmailFields] = React.useState<string[]>([""]); // Array of email input fields
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null);

  // Check if all participants are confirmed
  const allConfirmed = invitations.length > 0 && invitations.every(inv => inv.status === 'confirmed');
  const hasPendingInvitations = invitations.some(inv => !inv.invitationId && inv.status === 'pending');
  const hasSentInvitations = invitations.some(inv => inv.invitationId);
  const pendingInvitations = invitations.filter(inv => !inv.invitationId && inv.status === 'pending');

  // Track previous allConfirmed value to avoid infinite loops
  const prevAllConfirmedRef = React.useRef<boolean | undefined>(undefined);
  const onStatusChangeRef = React.useRef(onStatusChange);

  // Keep ref updated
  React.useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Notify parent when status changes (only when it actually changes)
  React.useEffect(() => {
    if (onStatusChangeRef.current && prevAllConfirmedRef.current !== allConfirmed) {
      prevAllConfirmedRef.current = allConfirmed;
      // Use setTimeout to break the update cycle
      setTimeout(() => {
        onStatusChangeRef.current?.(allConfirmed);
      }, 0);
    }
  }, [allConfirmed]);

  const addEmailField = () => {
    setEmailFields([...emailFields, ""]);
  };

  const updateEmailField = (index: number, value: string) => {
    const updated = [...emailFields];
    updated[index] = value;
    setEmailFields(updated);
  };

  const removeEmailField = (index: number) => {
    if (emailFields.length === 1) {
      // Keep at least one field
      setEmailFields([""]);
      return;
    }
    const updated = emailFields.filter((_, i) => i !== index);
    setEmailFields(updated);
  };

  const addAllInvitations = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emailFields.forEach((email, index) => {
      const trimmed = email.trim();
      if (!trimmed) return; // Skip empty fields

      if (emailRegex.test(trimmed)) {
        // Check if email already exists
        if (!invitations.some(inv => inv.email.toLowerCase() === trimmed.toLowerCase())) {
          validEmails.push(trimmed);
        }
      } else {
        invalidEmails.push(trimmed);
      }
    });

    if (emailFields.every(f => !f.trim())) {
      toast.error("No emails entered", "Please enter at least one email address");
      return;
    }

        if (invalidEmails.length > 0) {
          toast.warning("Invalid emails", `${invalidEmails.length} email${invalidEmails.length > 1 ? 's' : ''} were invalid and skipped`);
        }

    if (validEmails.length > 0) {
      onChange([...invitations, ...validEmails.map(email => ({ email, status: 'pending' as const }))]);
      toast.success("Participants added", `Added ${validEmails.length} participant${validEmails.length > 1 ? 's' : ''}`);
      setEmailFields([""]); // Reset to one empty field
    } else if (invalidEmails.length === 0) {
      toast.info("No new emails", "All emails are already in the list");
    }
  };

  const removeInvitation = (index: number) => {
    const next = [...invitations];
    next.splice(index, 1);
    onChange(next);
  };

  const sendInvitation = async (email: string, index: number) => {
    console.log(`[ParticipantInvitationEditor] 📤 sendInvitation called for:`, email, "requestId:", requestId);
    
    if (!requestId) {
      console.warn(`[ParticipantInvitationEditor] ⚠️ No requestId - cannot send invitation`);
      toast.info("Save request first", "Please save the request as draft or submit it first, then you can send invitations. The request ID is needed to link the invitations.");
      return;
    }

    setSending(email);
    try {
      console.log(`[ParticipantInvitationEditor] 📤 Sending fetch request to /api/participants/invite...`);
      const response = await fetch('/api/participants/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          email: email,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Update invitation with ID (even if it already existed)
      const next = [...invitations];
      next[index] = { ...next[index], invitationId: data.data.id, status: data.data.status || 'pending' };
      onChange(next);

      // Show warning if email sending failed
      if (data.warning) {
        // If email failed but we have a confirmation link, show it
        if (data.confirmationLink) {
          // Show modal with full link
          setLinkToShow({ email, link: data.confirmationLink });
          setShowLinkModal(true);
          
          // Also copy to clipboard automatically
          navigator.clipboard.writeText(data.confirmationLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => {
            // Silent fail
          });
        } else {
          toast.error("Email sending failed", data.warning);
        }
      } else {
        if (data.alreadyExists) {
          toast.info("Invitation already sent", `Invitation was already sent to ${email}`);
        } else {
          // Show success with email ID if available
          const emailId = data.emailId || data.data?.emailId;
          const resendUrl = data.resendUrl || (emailId ? `https://resend.com/emails/${emailId}` : null);
          
          if (emailId && resendUrl) {
            console.log(`[ParticipantInvitationEditor] ✅ Email sent! ID: ${emailId}`);
            console.log(`[ParticipantInvitationEditor] 🔗 Check delivery: ${resendUrl}`);
            toast.success("Invitation sent", `Sent to ${email}. Check console for delivery link.`);
            // Open Resend dashboard in new tab
            setTimeout(() => window.open(resendUrl, '_blank'), 500);
          } else {
            toast.success("Invitation sent", `Invitation sent to ${email}`);
          }
        }
      }

      // Start polling if not already started
      if (hasSentInvitations) {
        startPolling();
      }
    } catch (err: any) {
        toast.error("Failed to send", err.message || "Could not send invitation");
    } finally {
      setSending(null);
    }
  };

  const sendAllInvitations = async () => {
      if (!requestId) {
        toast.info("Save request first", "Please save the request as draft or submit it first, then you can send invitations. The request ID is needed to link the invitations.");
        return;
      }

    const pendingToSend = invitations.filter(inv => !inv.invitationId && inv.status === 'pending');
    if (pendingToSend.length === 0) {
      toast.info("No invitations to send", "All invitations have been sent");
      return;
    }

    setSendingAll(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Send all invitations in parallel
      const promises = pendingToSend.map(async (inv, originalIndex) => {
        const index = invitations.findIndex(i => i.email === inv.email);
        try {
          const response = await fetch('/api/participants/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: requestId,
              email: inv.email,
            }),
          });

          const data = await response.json();
          
          if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Failed to send invitation');
          }

          // Update invitation with ID
          const next = [...invitations];
          next[index] = { ...next[index], invitationId: data.data.id, status: 'pending' };
          onChange(next);
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Failed to send invitation to ${inv.email}:`, err);
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        toast.success("Invitations sent", `Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}`);
        
        // Start polling for status updates
        startPolling();
      }

      if (failCount > 0) {
        toast.error("Some invitations failed", `${failCount} invitation${failCount > 1 ? 's' : ''} could not be sent`);
      }
    } catch (err: any) {
      toast.error("Failed to send invitations", err.message || "Could not send invitations");
    } finally {
      setSendingAll(false);
    }
  };

  // Poll for participant status updates
  const checkParticipantStatus = async () => {
    if (!requestId || !hasSentInvitations) return;

    try {
      const response = await fetch(`/api/participants/status?request_id=${requestId}`);
      const data = await response.json();

      if (data.ok && data.data) {
        const updatedInvitations = invitations.map(inv => {
          const updated = data.data.find((d: any) => d.email === inv.email || d.id === inv.invitationId);
          if (updated) {
            // Status changed - show notification
            if (updated.status !== inv.status) {
              if (updated.status === 'confirmed') {
                toast.success("Participant confirmed", `${updated.name || updated.email} has confirmed their participation`);
                
                // Sync confirmed participant to applicants table
                // This will be handled by the parent component via onChange callback
                // The parent should merge confirmed participants into applicants array
                console.log("[ParticipantInvitationEditor] ✅ Participant confirmed, should sync to applicants:", {
                  name: updated.name,
                  email: updated.email,
                  department: updated.department,
                  availableFdp: updated.available_fdp,
                  signature: updated.signature,
                });
              } else if (updated.status === 'declined') {
                toast.info("Participant declined", `${updated.name || updated.email} has declined the invitation`);
              }
            }
            // Always update with latest data (name, department, etc.)
            return { 
              ...inv, 
              ...updated, 
              status: updated.status,
              name: updated.name || inv.name,
              department: updated.department || inv.department,
              availableFdp: updated.available_fdp || inv.availableFdp,
              signature: updated.signature || inv.signature,
            };
          }
          return inv;
        });

        // Always update to get latest name/department data
        onChange(updatedInvitations);
      }
    } catch (err) {
      console.error("Error checking participant status:", err);
    }
  };

  const startPolling = () => {
    if (pollingInterval) return; // Already polling

    // Poll every 5 seconds
    const interval = setInterval(checkParticipantStatus, 5000);
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Start polling when component mounts if there are sent invitations
  React.useEffect(() => {
    if (hasSentInvitations && !allConfirmed) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSentInvitations, allConfirmed]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'declined':
        return 'Declined';
      default:
        return 'Pending';
    }
  };

  const handleCopyLink = async () => {
    if (linkToShow?.link) {
      try {
        await navigator.clipboard.writeText(linkToShow.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!", "Invitation link copied to clipboard");
      } catch (err) {
        toast.error("Copy failed", "Please copy the link manually");
      }
    }
  };

  return (
    <>
      {/* Link Modal */}
      <Modal
        open={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkToShow(null);
          setCopied(false);
        }}
        title="📧 Invitation Link"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Email sending failed, but invitation is created!
            </p>
            <p className="text-xs text-yellow-700">
              Share this link manually with <strong>{linkToShow?.email}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={linkToShow?.link || ""}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm font-mono break-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> The link is already copied to your clipboard. Just paste (Ctrl+V) it in Messenger, email, or any chat app to share with the participant.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowLinkModal(false);
                setLinkToShow(null);
                setCopied(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <div className="mt-8 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between border-b-2 border-gray-200 pb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 tracking-tight">Participants</h4>
          <p className="mt-1 text-xs text-gray-600">
            Invite participants by email. They will receive a notification to confirm their participation.
          </p>
        </div>
        {invitations.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <span className={`text-xs font-semibold ${
                allConfirmed ? 'text-green-700' : 'text-amber-700'
              }`}>
                {invitations.filter(i => i.status === 'confirmed').length} / {invitations.length} confirmed
              </span>
            </div>
            {allConfirmed && (
              <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 px-3 py-1.5 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-green-700" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-green-700">All Confirmed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add new invitation fields */}
      {!disabled && (
        <div className="mb-5 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-800">Add Participants</label>
            <button
              type="button"
              onClick={addEmailField}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Field
            </button>
          </div>
          
          <div className="space-y-2">
            {emailFields.map((email, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <TextInput
                    label=""
                    placeholder={`Participant ${index + 1} email address`}
                    value={email}
                    onChange={(e) => updateEmailField(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        addAllInvitations();
                      }
                    }}
                  />
                </div>
                {emailFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailField(index)}
                    className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                    title="Remove field"
                  >
                    <XCircle className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAllInvitations}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#7A0010] bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-[#8A0010] hover:to-[#6A0010]"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            Add to List
          </button>
        </div>
      )}

      {/* Send All Button - Prominent */}
      {!disabled && invitations.length > 0 && hasPendingInvitations && (
        <div className="mb-5">
          <button
            type="button"
            onClick={sendAllInvitations}
            disabled={sendingAll || !requestId}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#7A0010] bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-[#8A0010] hover:to-[#6A0010] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingAll ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending {pendingInvitations.length} Invitation{pendingInvitations.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" strokeWidth={2.5} />
                Send All Invitations ({pendingInvitations.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Invitations list */}
      <div className="space-y-3">
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/30 py-12 text-center">
            <Mail className="h-14 w-14 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">No participants added yet</p>
            <p className="text-xs text-gray-500 mt-1">Add participants by entering their email addresses</p>
          </div>
        ) : (
          invitations.map((inv, index) => (
            <div
              key={index}
              className={`rounded-xl border-2 p-4 shadow-sm transition-all ${
                inv.status === 'confirmed'
                  ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-green-100/30'
                  : inv.status === 'declined'
                  ? 'border-red-200 bg-gradient-to-br from-red-50/50 to-red-100/30'
                  : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{inv.email}</span>
                    {getStatusIcon(inv.status)}
                    <span className={`text-xs font-medium ${
                      inv.status === 'confirmed' ? 'text-green-700' :
                      inv.status === 'declined' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>
                      {getStatusText(inv.status)}
                    </span>
                  </div>
                  
                  {inv.name && (
                    <div className="ml-6 mt-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                      {inv.department && (
                        <span className="text-xs text-gray-500">• {inv.department}</span>
                      )}
                      {inv.availableFdp !== null && inv.availableFdp !== undefined && (
                        <span className="text-xs text-gray-500">• FDP: {inv.availableFdp}</span>
                      )}
                    </div>
                  )}
                  
                  {inv.status === 'confirmed' && (
                    <div className="ml-6 mt-2 flex items-center gap-2 rounded-lg bg-green-100 px-2 py-1 w-fit">
                      <CheckCircle2 className="h-3 w-3 text-green-700" />
                      <span className="text-xs font-medium text-green-700">Consented & Informed</span>
                    </div>
                  )}
                  
                  {inv.status === 'pending' && !inv.invitationId && !disabled && (
                    <div className="mt-2 ml-6">
                      <button
                        type="button"
                        onClick={() => sendInvitation(inv.email, index)}
                        disabled={sending === inv.email}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sending === inv.email ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3" />
                            Send Invitation
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {inv.status === 'pending' && inv.invitationId && (
                    <div className="mt-2 ml-6 flex items-center gap-2 text-xs text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      Waiting for confirmation
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!disabled && inv.status === 'pending' && inv.invitationId && (
                    <button
                      type="button"
                      onClick={() => sendInvitation(inv.email, index)}
                      disabled={sending === inv.email}
                      className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Resend invitation email"
                    >
                      {sending === inv.email ? (
                        <>
                          <div className="h-3 w-3 inline-block animate-spin rounded-full border-2 border-blue-700 border-t-transparent mr-1.5" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 inline mr-1" />
                          Resend
                        </>
                      )}
                    </button>
                  )}
                  
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeInvitation(index)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info box */}
      {invitations.length > 0 && (
        <div className="mt-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/30 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1.5">Note:</p>
              <p className="leading-relaxed">You can send invitations before or after submitting the request. Participants will receive an email notification with a confirmation link. Their confirmations will be tracked and visible here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

