"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

interface HRRequestModalProps {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  readOnly?: boolean;
}

export default function HRRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
  readOnly = false,
}: HRRequestModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 150;

    // Set drawing style
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL();
  };

  const handleApprove = async () => {
    if (!hasSignature) {
      toast({ message: "Please provide your signature", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = getSignatureData();
      const res = await fetch("/api/hr/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature: signatureData,
          notes: notes.trim() || "Approved by HR",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        console.log("[HR Approve] Showing success toast...");
        toast({ message: "✅ Request approved and sent to Executive for final approval", kind: "success" });
        // Delay to show toast before closing
        console.log("[HR Approve] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[HR Approve] Closing modal now");
          onApproved(request.id);
        }, 1500);
      } else {
        toast({ message: data.error || "Failed to approve request", kind: "error" });
      }
    } catch (err) {
      toast({ message: "Failed to approve request. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({ message: "Please provide a reason for rejection", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        console.log("[HR Reject] Showing info toast...");
        toast({ message: "❌ Request rejected and returned to user", kind: "info" });
        // Delay to show toast before closing
        console.log("[HR Reject] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[HR Reject] Closing modal now");
          onRejected(request.id);
        }, 1500);
      } else {
        toast({ message: data.error || "Failed to reject request", kind: "error" });
      }
    } catch (err) {
      toast({ message: "Failed to reject request. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Debug logging
  console.log("HR Modal - Full Request Data:", request);
  console.log("HR Modal - Department Object:", request.department);
  console.log("HR Modal - Department ID:", request.department_id);
  console.log("HR Modal - Requester:", request.requester);
  
  // For representative submissions, prioritize requester_name (the actual person traveling)
  const requester = request.requester_name || request.requester?.name || "Unknown";
  const department = request.department?.name || request.department?.code || request.requester?.department || "Not specified";
  const participants = request.participants || [];
  const expenseBreakdown = request.expense_breakdown || [];
  
  // Check if submitted by representative
  const isRepresentative = request.is_representative_submission || request.is_representative;
  const submittedBy = request.submitted_by_name || null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-[#7A0010] text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-bold">{request.request_number}</h2>
            <p className="text-sm opacity-90">HR Approval Required</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Date Submitted */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="text-xs font-medium text-blue-700">Date Submitted</label>
            <p className="text-sm font-semibold text-blue-900">
              {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
            </p>
          </div>

          {/* Requester Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Requesting Person</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <p className="text-sm font-semibold">{requester}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Department</label>
                <p className="text-sm font-semibold">{department}</p>
              </div>
              {isRepresentative && submittedBy && (
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <label className="text-xs font-medium text-blue-700">Submitted on behalf by:</label>
                  <p className="text-sm font-semibold text-blue-900">{submittedBy}</p>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">Email</label>
                <p className="text-sm">{request.requester?.email || "—"}</p>
              </div>
              {request.requester_signature && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Requester Digital Signature</label>
                  <div className="mt-2 border rounded p-2 bg-white">
                    <img
                      src={request.requester_signature}
                      alt="Requester Signature"
                      className="max-h-24"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Travel Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Travel Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">Purpose</label>
                <p className="text-sm">{request.purpose}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">Destination</label>
                <p className="text-sm font-semibold">{request.destination}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Start Date</label>
                <p className="text-sm">
                  {request.travel_start_date
                    ? new Date(request.travel_start_date).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">End Date</label>
                <p className="text-sm">
                  {request.travel_end_date
                    ? new Date(request.travel_end_date).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Participants ({participants.length})
              </h3>
              <div className="space-y-2">
                {participants.map((p: any, i: number) => (
                  <div key={i} className="text-sm bg-white p-2 rounded">
                    <span className="font-medium">{p.name}</span>
                    {p.role && <span className="text-gray-500"> • {p.role}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Information */}
          {request.has_budget && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-700 mb-3">Budget Information</h3>
              <div className="mb-3">
                <label className="text-xs font-medium text-blue-600">Total Budget</label>
                <p className="text-2xl font-bold text-blue-900">
                  ₱{request.total_budget?.toLocaleString() || "0"}
                </p>
              </div>

              {/* Expense Breakdown */}
              {expenseBreakdown.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-blue-600 block mb-2">
                    Expense Breakdown
                  </label>
                  <div className="space-y-1">
                    {expenseBreakdown.map((expense: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-white p-2 rounded text-sm"
                      >
                        <div>
                          <span className="font-medium">{expense.item}</span>
                          {expense.description && (
                            <span className="text-gray-500 text-xs ml-2">
                              ({expense.description})
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-blue-900">
                          ₱{expense.amount?.toLocaleString() || "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comptroller Approval */}
              {request.comptroller_approved_at && (
                <div className="mt-3 p-2 bg-green-100 rounded">
                  <p className="text-xs text-green-700 font-medium">
                    ✓ Budget Approved by Comptroller
                  </p>
                  <p className="text-xs text-green-600">
                    {new Date(request.comptroller_approved_at).toLocaleString()}
                  </p>
                  {request.comptroller_comments && (
                    <p className="text-xs text-gray-600 mt-1">
                      Note: {request.comptroller_comments}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vehicle & Driver Assignment */}
          {request.needs_vehicle && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Vehicle & Driver Assignment
              </h3>

              {/* Transportation Mode */}
              <div className="bg-white rounded p-3 mb-3">
                <label className="text-xs font-medium text-blue-600">TRANSPORTATION MODE</label>
                <p className="text-sm font-semibold">
                  {request.vehicle_mode === "owned"
                    ? "University Vehicle (School Service)"
                    : request.vehicle_mode === "rental"
                    ? "Rental Vehicle"
                    : "Personal Vehicle"}
                </p>
              </div>

              {/* Service Preferences */}
              {(request.preferred_driver_id || request.preferred_vehicle_id) && (
                <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-3">
                  <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    SERVICE PREFERENCES - Requester's Choice
                  </label>
                  <p className="text-xs text-blue-600 italic">
                    Suggestions from requester (Admin will make final assignment)
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {request.preferred_driver_id && (
                      <div className="bg-white rounded p-2">
                        <label className="text-xs font-medium text-gray-500">Preferred Driver</label>
                        <p className="text-sm font-semibold">
                          {request.preferred_driver?.name || "—"}
                        </p>
                      </div>
                    )}
                    {request.preferred_vehicle_id && (
                      <div className="bg-white rounded p-2">
                        <label className="text-xs font-medium text-gray-500">Preferred Vehicle</label>
                        <p className="text-sm font-semibold">
                          {request.preferred_vehicle?.vehicle_name || request.preferred_vehicle?.plate_number || "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded p-3 border">
                  <label className="text-xs font-medium text-gray-500">Assigned Driver</label>
                  <p className="text-sm font-semibold">
                    {request.assigned_driver_id ? "Driver Assigned" : "— Select Driver —"}
                  </p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <label className="text-xs font-medium text-gray-500">Assigned Vehicle</label>
                  <p className="text-sm font-semibold">
                    {request.assigned_vehicle_id ? "Vehicle Assigned" : "— Select Vehicle —"}
                  </p>
                </div>
              </div>

              {request.needs_rental && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800 font-medium">
                    ⚠ Rental vehicle required
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Department Head Endorsement */}
          {request.head_approved_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Department Head Endorsement
              </h3>
              {request.head_signature && (
                <div className="bg-white border rounded p-3 mb-2">
                  <img
                    src={request.head_signature}
                    alt="Head Signature"
                    className="max-h-20"
                  />
                </div>
              )}
              <p className="text-sm text-green-800">
                <span className="font-medium">
                  {request.head_approver?.name || "Department Head"}
                </span>
                <br />
                <span className="text-xs">
                  Dept. Head, {department}
                </span>
                <br />
                <span className="text-xs">
                  {new Date(request.head_approved_at).toLocaleDateString()}
                </span>
              </p>
              {request.head_comments && (
                <p className="text-xs text-gray-600 mt-2 italic">
                  Note: {request.head_comments}
                </p>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {request.admin_notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-700 mb-2">Admin Notes</h3>
              <p className="text-sm text-gray-700">{request.admin_notes}</p>
              {request.admin_approved_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Processed on {new Date(request.admin_approved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Approval History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Submission History</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                <div className="flex-1">
                  <p className="font-medium">Request Submitted</p>
                  <p className="text-xs text-gray-500">
                    by {submittedBy || requester}
                    <br />
                    {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              {request.head_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Head Approved</p>
                    <p className="text-xs text-gray-500">
                      by {request.head_approver?.name || "Department Head"}
                      <br />
                      {new Date(request.head_approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {request.admin_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Admin Processed</p>
                    <p className="text-xs text-gray-500">
                      by {request.admin_approver?.name || "Admin"}
                      <br />
                      {new Date(request.admin_approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {request.comptroller_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Comptroller Approved</p>
                    <p className="text-xs text-gray-500">
                      Budget approved
                      <br />
                      {new Date(request.comptroller_approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {request.hr_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">HR Approved</p>
                    <p className="text-xs text-gray-500">
                      by {request.hr_approver?.name || "HR"}
                      <br />
                      {new Date(request.hr_approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {!request.hr_approved_at && !request.rejected_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 animate-pulse"></span>
                  <div className="flex-1">
                    <p className="font-bold text-[#7A0010]">Pending HR Approval</p>
                    <p className="text-xs text-gray-500">Awaiting your action</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HR Approval Section - Show if already approved/rejected */}
          {readOnly && request.hr_approved_at ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                HR Approved
              </h3>
              
              {request.hr_signature && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">HR Digital Signature</label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <img
                      src={request.hr_signature}
                      alt="HR Signature"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Approved by:</span>{" "}
                  <span className="text-gray-900">{request.hr_approver?.name || "HR"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(request.hr_approved_at).toLocaleString()}
                  </span>
                </div>
                {request.hr_comments && (
                  <div>
                    <span className="font-semibold text-gray-700">Comments:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-white border border-gray-200 rounded">
                      {request.hr_comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : readOnly && request.rejected_at ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-700 mb-4">
                Request Rejected by HR
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Rejected by:</span>{" "}
                  <span className="text-gray-900">{request.hr_approver?.name || "HR"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(request.rejected_at).toLocaleString()}
                  </span>
                </div>
                {request.hr_comments && (
                  <div>
                    <span className="font-semibold text-gray-700">Reason:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-white border border-gray-200 rounded">
                      {request.hr_comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* HR Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  HR Notes/Comments
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                  rows={4}
                  placeholder="Add your comments or notes about this request..."
                />
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  HR Signature <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair bg-gray-50 rounded"
                    style={{ touchAction: "none" }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Sign above using your mouse or touchpad
                    </p>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  By signing, you confirm that you have reviewed and verified all details of this
                  request.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions - Only show if NOT read-only */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t rounded-b-xl">
            <button
              onClick={handleApprove}
              disabled={submitting || !hasSignature}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {submitting ? "Approving..." : "✓ Approve Request"}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting || !notes.trim()}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {submitting ? "Rejecting..." : "✗ Reject Request"}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Close button for read-only mode */}
        {readOnly && (
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-xl">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
