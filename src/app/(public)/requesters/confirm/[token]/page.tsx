// src/app/(public)/requesters/confirm/[token]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Mail, Calendar, MapPin, User } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { TextInput, TextArea } from "@/components/user/request/ui/controls";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";

export default function RequesterConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [invitation, setInvitation] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<'confirm' | 'decline' | null>(null);

  // Form data for confirmation
  const [name, setName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  const [declinedReason, setDeclinedReason] = React.useState("");

  React.useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requesters/confirm?token=${token}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || "Failed to load invitation");
        return;
      }

      setInvitation(data.data);
      
      // Auto-fill from existing confirmation data if available
      if (data.data.name) setName(data.data.name);
      if (data.data.department) setDepartment(data.data.department);
      
      // Auto-populate from user profile if user exists in system
      if (data.data.userProfile && data.data.userProfile.isUser) {
        if (data.data.userProfile.name && !name) {
          setName(data.data.userProfile.name);
        }
        if (data.data.userProfile.department && !department) {
          setDepartment(data.data.userProfile.department);
        }
        console.log("[requester-confirm] ✅ Auto-populated from user profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!action || submitting) return; // Prevent double submission

    if (action === 'confirm' && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (action === 'confirm' && !signature && !invitation?.userProfile?.hasSignature) {
      setError("Please provide your signature");
      return;
    }

    if (action === 'decline' && !declinedReason.trim()) {
      setError("Please provide a reason for declining");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/requesters/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action,
          name: name.trim(),
          department: department.trim() || undefined,
          signature: signature || undefined,
          declined_reason: declinedReason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      // Success - redirect to success page
      router.push('/requesters/confirm/success');
    } catch (err: any) {
      setError(err.message || "Failed to submit response");
      setSubmitting(false); // Re-enable form on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7A0010] mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const request = invitation.request;
  const isConfirmed = invitation.status === 'confirmed';
  const isDeclined = invitation.status === 'declined';
  const isExpired = invitation.status === 'expired';

  if (isConfirmed || isDeclined || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          {isConfirmed ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Already Confirmed</h1>
              <p className="text-gray-600">You have already confirmed your participation in this request.</p>
            </>
          ) : isDeclined ? (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation Declined</h1>
              <p className="text-gray-600">You have already declined this invitation.</p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h1>
              <p className="text-gray-600">This invitation has expired. Please contact the requester for a new invitation.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 relative">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#7A0010] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {action === 'confirm' ? 'Confirming Participation...' : 'Processing Decline...'}
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we process your response. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-[#7A0010]/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-[#7A0010]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Travel Request Confirmation</h1>
              <p className="text-sm text-gray-500">You've been added as a requester</p>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {request?.title || request?.purpose || "Travel Request"}
                </p>
                <p className="text-xs text-gray-500">
                  {request?.travel_start_date && request?.travel_end_date
                    ? `${new Date(request.travel_start_date).toLocaleDateString()} - ${new Date(request.travel_end_date).toLocaleDateString()}`
                    : "Dates TBA"}
                </p>
              </div>
            </div>

            {request?.destination && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{request.destination}</p>
                </div>
              </div>
            )}

            {request?.requester && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Requested by: <span className="font-medium">{request.requester.name}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Selection */}
        {!action ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How would you like to respond?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setAction('confirm')}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-semibold text-green-900">Confirm Participation</span>
                <span className="text-xs text-green-700 mt-1">I will be part of this request</span>
              </button>

              <button
                onClick={() => setAction('decline')}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-8 w-8 text-red-600 mb-2" />
                <span className="font-semibold text-red-900">Decline Invitation</span>
                <span className="text-xs text-red-700 mt-1">I cannot participate</span>
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Form */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {action === 'confirm' ? 'Confirm Your Participation' : 'Decline Invitation'}
              </h2>
              <button
                onClick={() => {
                  setAction(null);
                  setError(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {action === 'confirm' ? (
              <>
                {invitation?.userProfile?.isUser ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>✓ Account Found:</strong> We found your TraviLink account. Your name and department have been pre-filled.
                      {invitation.userProfile.hasSignature && " Your signature will be automatically added when you confirm."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>ℹ️ New User:</strong> You're not yet registered in TraviLink. Please fill in your information below.
                    </p>
                  </div>
                )}

                <TextInput
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />

                <DepartmentSelect
                  label="Department / Office"
                  value={department}
                  onChange={setDepartment}
                  placeholder="Select your department"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature <span className="text-red-500">*</span>
                    {invitation?.userProfile?.hasSignature && (
                      <span className="ml-2 text-xs text-green-600">(Will use your saved signature)</span>
                    )}
                  </label>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <SignaturePad
                      height={160}
                      value={signature}
                      onSave={(dataUrl) => setSignature(dataUrl)}
                      onClear={() => setSignature(null)}
                      hideSaveButton
                    />
                  </div>
                </div>
              </>
            ) : (
              <TextArea
                label="Reason for Declining"
                required
                value={declinedReason}
                onChange={(e) => setDeclinedReason(e.target.value)}
                placeholder="Please provide a reason for declining this invitation..."
                rows={4}
              />
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex-1 rounded-lg px-4 py-3 font-medium text-white transition-all ${
                  action === 'confirm'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  action === 'confirm' ? 'Confirm Participation' : 'Decline Invitation'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

