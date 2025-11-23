// src/app/(public)/head-endorsements/confirm/[token]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Mail, Calendar, MapPin, Building2, PenTool, Users, UserCheck, DollarSign, FileText } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

export default function HeadEndorsementConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  
  let token = (params?.token as string) || "";
  
  if (!token && typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    const tokenIndex = pathParts.indexOf('confirm');
    if (tokenIndex >= 0 && tokenIndex < pathParts.length - 1) {
      token = pathParts[tokenIndex + 1];
    }
  }

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [invitation, setInvitation] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<'confirm' | 'decline' | null>(null);
  const [departmentRequesters, setDepartmentRequesters] = React.useState<any[]>([]);
  const [departmentParticipants, setDepartmentParticipants] = React.useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = React.useState<any[]>([]);
  const [totalBudget, setTotalBudget] = React.useState<number>(0);

  // Form data for confirmation
  const [headName, setHeadName] = React.useState("");
  const [endorsementDate, setEndorsementDate] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState("");
  const [declinedReason, setDeclinedReason] = React.useState("");

  React.useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError("Token not found in URL. Please check the confirmation link.");
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token || !token.trim()) {
        setError("Invalid token. Please check the confirmation link.");
        setLoading(false);
        return;
      }
      
      let tokenToUse = token;
      try {
        const decoded = decodeURIComponent(token);
        if (decoded !== token && decoded.length > 0) {
          tokenToUse = decoded;
        }
      } catch (e) {
        tokenToUse = token;
      }
      
      const apiUrl = `/api/head-endorsements/confirm?token=${encodeURIComponent(tokenToUse)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to load invitation (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.ok || !data.data) {
        throw new Error(data.error || "Invalid invitation");
      }

      const inv = data.data;
      setInvitation(inv);
      
      // Set department requesters and participants
      setDepartmentRequesters(inv.department_requesters || []);
      setDepartmentParticipants(inv.department_participants || []);
      
      // Set expense breakdown
      const breakdown = inv.request?.expense_breakdown;
      if (Array.isArray(breakdown)) {
        setExpenseBreakdown(breakdown);
        const total = breakdown.reduce((sum: number, item: any) => {
          const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        setTotalBudget(total);
      } else {
        setExpenseBreakdown([]);
        setTotalBudget(inv.request?.total_budget || 0);
      }
      
      // Pre-fill form if already confirmed
      if (inv.status === 'confirmed') {
        setHeadName(inv.head_name || "");
        setEndorsementDate(inv.endorsement_date || "");
        setSignature(inv.signature || null);
        setComments(inv.comments || "");
      } else {
        // Pre-fill with today's date
        const today = new Date().toISOString().split('T')[0];
        setEndorsementDate(today);
        setHeadName(inv.head_name || "");
      }
    } catch (err: any) {
      console.error("[head-endorsement-confirm] Error:", err);
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (submitAction?: 'confirm' | 'decline') => {
    const finalAction = submitAction || action;
    
    if (!finalAction) {
      setError("Please select an action (Confirm or Decline)");
      return;
    }

    if (finalAction === "confirm") {
      if (!headName.trim()) {
        setError("Head name is required");
        return;
      }
      if (!endorsementDate) {
        setError("Endorsement date is required");
        return;
      }
      if (!signature) {
        setError("Digital signature is required");
        return;
      }
    } else {
      if (!declinedReason.trim()) {
        setError("Reason for declining is required");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    // Debug logging
    console.log("[head-endorsement-confirm] 📤 Submitting confirmation:", {
      action: finalAction,
      hasSignature: !!signature,
      signatureLength: signature ? signature.length : 0,
      signaturePreview: signature ? signature.substring(0, 50) + "..." : "NULL",
      headName: headName.trim(),
      endorsementDate,
    });

    try {
      const requestBody = {
        token,
        action: finalAction,
        head_name: headName.trim(),
        endorsement_date: endorsementDate,
        signature: signature || null, // Send null instead of undefined
        comments: comments.trim() || null,
        declined_reason: declinedReason.trim() || null,
      };

      console.log("[head-endorsement-confirm] 📤 Request body:", {
        ...requestBody,
        signature: requestBody.signature ? `${requestBody.signature.substring(0, 50)}...` : "NULL",
      });

      const response = await fetch('/api/head-endorsements/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      console.log("[head-endorsement-confirm] ✅ Confirmation successful:", data);
      
      setTimeout(() => {
        router.push('/head-endorsements/confirm/success');
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to submit response");
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7A0010] mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Head Endorsement Request</h1>
          <p className="text-gray-600">
            {isConfirmed 
              ? "You have already endorsed this request" 
              : isDeclined 
              ? "You have declined this request"
              : "Please review and endorse this travel request"}
          </p>
        </div>

        {/* Request Details Card */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#7A0010]" />
            Request Details
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Request Number</p>
              <p className="text-lg font-semibold text-gray-900">{request?.request_number || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Title</p>
              <p className="text-gray-900">{request?.title || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Destination</p>
              <p className="text-gray-900 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {request?.destination || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Travel Dates</p>
              <p className="text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {request?.travel_start_date 
                  ? new Date(request.travel_start_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'N/A'}
                {request?.travel_end_date && request.travel_end_date !== request.travel_start_date && (
                  <> - {new Date(request.travel_end_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Department Requiring Endorsement</p>
              <p className="text-gray-900">{invitation.department_name || invitation.department?.name || 'N/A'}</p>
            </div>
            
            {request?.purpose && (
              <div>
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="text-gray-900">{request.purpose}</p>
              </div>
            )}
          </div>
        </div>

        {/* Faculty Members Requiring Endorsement */}
        {(departmentRequesters.length > 0 || departmentParticipants.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Faculty Members from {invitation.department_name || invitation.department?.name || 'Your Department'}
            </h2>
            
            {departmentRequesters.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Requesting Persons ({departmentRequesters.length})
                </h3>
                <div className="space-y-2">
                  {departmentRequesters.map((req: any, idx: number) => (
                    <div key={req.id || idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {req.profile_picture ? (
                        <img 
                          src={req.profile_picture} 
                          alt={req.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{req.name || 'Unknown'}</p>
                        {req.email && (
                          <p className="text-xs text-gray-600">{req.email}</p>
                        )}
                        {req.department && (
                          <p className="text-xs text-gray-500">{req.department}</p>
                        )}
                      </div>
                      {req.status === 'confirmed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {departmentParticipants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Participants ({departmentParticipants.length})
                </h3>
                <div className="space-y-2">
                  {departmentParticipants.map((part: any, idx: number) => (
                    <div key={part.id || idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      {part.profile_picture ? (
                        <img 
                          src={part.profile_picture} 
                          alt={part.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{part.name || 'Unknown'}</p>
                        {part.email && (
                          <p className="text-xs text-gray-600">{part.email}</p>
                        )}
                        {part.department && (
                          <p className="text-xs text-gray-500">{part.department}</p>
                        )}
                      </div>
                      {part.status === 'confirmed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Budget Breakdown */}
        {(expenseBreakdown.length > 0 || totalBudget > 0) && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Budget Breakdown
            </h2>
            
            {expenseBreakdown.length > 0 && (
              <div className="space-y-3 mb-4">
                {expenseBreakdown.map((expense: any, idx: number) => {
                  const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || 0);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expense.item || expense.description || `Expense ${idx + 1}`}</p>
                        {expense.description && expense.description !== expense.item && (
                          <p className="text-xs text-gray-600 mt-1">{expense.description}</p>
                        )}
                        {expense.quantity && (
                          <p className="text-xs text-gray-500 mt-1">Quantity: {expense.quantity}</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₱{isNaN(amount) ? '0.00' : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            
            {totalBudget > 0 && (
              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">Total Budget</p>
                  <p className="text-xl font-bold text-green-600">
                    ₱{totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Form */}
        {!isConfirmed && !isDeclined && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Endorsement Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-gray-300 px-4 text-sm font-medium focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endorsement Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endorsementDate}
                  onChange={(e) => setEndorsementDate(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-gray-300 px-4 text-sm font-medium focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature <span className="text-red-500">*</span>
                </label>
                <SignaturePad
                  height={160}
                  value={signature}
                  onSave={(dataUrl) => {
                    console.log("[head-endorsement-confirm] ✍️ Signature saved:", {
                      hasData: !!dataUrl,
                      length: dataUrl ? dataUrl.length : 0,
                      preview: dataUrl ? dataUrl.substring(0, 50) + "..." : "NULL",
                    });
                    setSignature(dataUrl);
                  }}
                  onClear={() => {
                    console.log("[head-endorsement-confirm] 🗑️ Signature cleared");
                    setSignature(null);
                  }}
                  showUseSavedButton={true}
                  hideSaveButton
                />
                {!signature && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Signature is required to endorse this request
                  </p>
                )}
                {signature && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Signature captured ({Math.round(signature.length / 1024)}KB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-2 text-sm focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                  placeholder="Add any comments or notes..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSubmit('confirm')}
                disabled={submitting || !headName.trim() || !endorsementDate || !signature}
                className="flex-1 bg-[#7A0010] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#5a000c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && action === 'confirm' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Endorsement
                  </>
                )}
              </button>
              
              <button
                onClick={() => setAction('decline')}
                disabled={submitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Decline
              </button>
            </div>

            {/* Decline Form */}
            {action === 'decline' && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <label className="block text-sm font-medium text-red-900 mb-2">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declinedReason}
                  onChange={(e) => setDeclinedReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-red-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  placeholder="Please provide a reason for declining this endorsement..."
                  required
                />
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => handleSubmit('decline')}
                    disabled={submitting || !declinedReason.trim()}
                    className="bg-red-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting && action === 'decline' ? 'Processing...' : 'Submit Decline'}
                  </button>
                  <button
                    onClick={() => {
                      setAction(null);
                      setDeclinedReason("");
                    }}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Already Confirmed */}
        {isConfirmed && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Endorsement Confirmed</h3>
            <p className="text-green-700">
              You have already endorsed this request on {invitation.confirmed_at 
                ? new Date(invitation.confirmed_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'N/A'}
            </p>
            {invitation.signature && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-900 mb-2">Your Signature:</p>
                <img 
                  src={invitation.signature} 
                  alt="Endorsement signature"
                  className="mx-auto h-20 border-2 border-green-300 rounded-lg bg-white p-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Already Declined */}
        {isDeclined && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Endorsement Declined</h3>
            <p className="text-red-700">
              You have declined this request on {invitation.declined_at 
                ? new Date(invitation.declined_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'N/A'}
            </p>
            {invitation.declined_reason && (
              <div className="mt-4 text-left">
                <p className="text-sm font-medium text-red-900 mb-1">Reason:</p>
                <p className="text-red-700">{invitation.declined_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

