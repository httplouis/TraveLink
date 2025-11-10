"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

interface ExecRequestModalProps {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  readOnly?: boolean;
}

export default function ExecRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
  readOnly = false,
}: ExecRequestModalProps) {
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

    canvas.width = canvas.offsetWidth;
    canvas.height = 150;
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleApprove = async () => {
    console.log("[Executive] ========== APPROVE BUTTON CLICKED ==========");
    console.log("[Executive] Has signature:", !!hasSignature);
    
    if (!hasSignature) {
      console.log("[Executive] No signature - showing error toast");
      toast({ message: "Please provide your signature", kind: "error" });
      return;
    }

    console.log("[Executive] Starting approval process...");
    setSubmitting(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL();

      const res = await fetch("/api/exec/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature: signatureData,
          notes: notes.trim() || "Approved by Executive",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        console.log("[Executive] Showing success toast...");
        toast({ message: "✅ Request approved - This is the final approval!", kind: "success" });
        console.log("[Executive] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Executive] Closing modal now");
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
      const res = await fetch("/api/exec/action", {
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
        console.log("[Executive] Showing info toast...");
        toast({ message: "❌ Request rejected and returned to requester", kind: "info" });
        console.log("[Executive] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Executive] Closing modal now");
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

  const requester = request.requester_name || request.requester?.name || "Unknown";
  const submittedBy = request.submitted_by_name || request.requester?.name || "Unknown";
  const isRepresentative = request.is_representative_submission;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-6 py-4 text-white">
          <div>
            <h2 className="text-2xl font-bold">{request.request_number || "Request"}</h2>
            <p className="text-sm text-white/90">Executive Final Approval Required</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Requester</label>
              <p className="font-semibold text-gray-900">{requester}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Department</label>
              <p className="font-semibold text-gray-900">
                {request.department?.name || request.department?.code || "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Purpose</label>
              <p className="font-semibold text-gray-900">{request.purpose || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Travel Dates</label>
              <p className="font-semibold text-gray-900">
                {request.travel_start_date
                  ? `${new Date(request.travel_start_date).toLocaleDateString()} - ${
                      request.travel_end_date
                        ? new Date(request.travel_end_date).toLocaleDateString()
                        : "—"
                    }`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Approval History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Approval Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                <div className="flex-1">
                  <p className="font-medium text-green-700">Head Approved</p>
                  <p className="text-xs text-gray-500">
                    {request.head_approver?.name || "Department Head"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                <div className="flex-1">
                  <p className="font-medium text-green-700">Admin Processed</p>
                  <p className="text-xs text-gray-500">{request.admin_approver?.name || "Admin"}</p>
                </div>
              </div>

              {request.comptroller_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Comptroller Approved</p>
                    <p className="text-xs text-gray-500">Budget approved</p>
                  </div>
                </div>
              )}

              {request.hr_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">HR Approved</p>
                    <p className="text-xs text-gray-500">{request.hr_approver?.name || "HR"}</p>
                  </div>
                </div>
              )}

              {request.exec_approved_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Executive Approved</p>
                    <p className="text-xs text-gray-500">
                      by {request.exec_approver?.name || "Executive"}
                      <br />
                      {new Date(request.exec_approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {!request.exec_approved_at && !request.rejected_at && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 animate-pulse"></span>
                  <div className="flex-1">
                    <p className="font-bold text-[#7A0010]">Pending Executive Final Approval</p>
                    <p className="text-xs text-gray-500">Awaiting your action</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Executive Approval Section */}
          {readOnly && request.exec_approved_at ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Executive Approved - Final Approval
              </h3>
              
              {request.exec_signature && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Executive Digital Signature</label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <img
                      src={request.exec_signature}
                      alt="Executive Signature"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Approved by:</span>{" "}
                  <span className="text-gray-900">{request.exec_approver?.name || "Executive"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(request.exec_approved_at).toLocaleString()}
                  </span>
                </div>
                {request.exec_comments && (
                  <div>
                    <span className="font-semibold text-gray-700">Comments:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-white border border-gray-200 rounded">
                      {request.exec_comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : readOnly && request.rejected_at ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-700 mb-4">
                Request Rejected by Executive
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Rejected by:</span>{" "}
                  <span className="text-gray-900">{request.exec_approver?.name || "Executive"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(request.rejected_at).toLocaleString()}
                  </span>
                </div>
                {request.exec_comments && (
                  <div>
                    <span className="font-semibold text-gray-700">Reason:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-white border border-gray-200 rounded">
                      {request.exec_comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Executive Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Executive Notes/Comments
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                  rows={4}
                  placeholder="Add your final comments or notes about this request..."
                />
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Executive Signature <span className="text-red-500">*</span>
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
                  By signing, you provide the final executive approval for this travel request.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t rounded-b-xl">
            <button
              onClick={handleApprove}
              disabled={submitting || !hasSignature}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {submitting ? "Approving..." : "✓ Approve Request (Final Approval)"}
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
