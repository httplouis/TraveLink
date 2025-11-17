"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

interface VPRequestModalProps {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}

export default function VPRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
}: VPRequestModalProps) {
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
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
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

  const getSignatureData = (): string | null => {
    if (!hasSignature) return null;
    const canvas = canvasRef.current;
    return canvas?.toDataURL() || null;
  };

  const handleApprove = async () => {
    if (!hasSignature) {
      toast({ message: "⚠️ Please provide your signature", kind: "error" });
      return;
    }

    // Validate notes
    if (!notes.trim() || notes.trim().length < 10) {
      toast({ message: "Notes are required and must be at least 10 characters long", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const signature = getSignatureData();
      
      // Check if requester is a head (Dean/Director) - if so, must go to President
      const isHeadRequest = request.requester_is_head || false;
      
      const res = await fetch("/api/vp/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature,
          notes: notes.trim(),
          is_head_request: isHeadRequest, // Flag to indicate if this is from a head
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({ message: "✅ " + data.message, kind: "success" });
        setTimeout(() => {
          onApproved(request.id);
          onClose();
        }, 1500);
      } else {
        toast({ message: "❌ " + (data.error || "Failed to approve request"), kind: "error" });
      }
    } catch (error) {
      toast({ message: "❌ An error occurred", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({ message: "⚠️ Please provide a reason for rejection", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vp/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
          notes,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({ message: "❌ Request rejected", kind: "info" });
        setTimeout(() => {
          onRejected(request.id);
          onClose();
        }, 1500);
      } else {
        toast({ message: "❌ " + (data.error || "Failed to reject request"), kind: "error" });
      }
    } catch (error) {
      toast({ message: "❌ An error occurred", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if other VP has already signed
  const otherVPApproved = request.vp_approved_by && request.vp_approved_by !== request.vp2_approved_by;
  const isSecondVP = !!request.vp_approved_by && !request.vp2_approved_by;
  const firstVPName = request.vp_approver?.name || "First VP";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">VP Review</h2>
            <p className="text-sm text-gray-600">{request.request_number}</p>
            {isSecondVP && (
              <div className="mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900">
                  ✓ {firstVPName} has already approved this request. Your approval will complete the VP review process.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Requester</label>
                <p className="text-base text-gray-900">{request.requester_name}</p>
                <p className="text-sm text-gray-600">{request.requester?.position_title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Department</label>
                <p className="text-base text-gray-900">{request.department?.name || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Purpose</label>
              <p className="text-base text-gray-900">{request.purpose}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Destination</label>
              <p className="text-base text-gray-900">{request.destination}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Travel Start</label>
                <p className="text-base text-gray-900">
                  {new Date(request.travel_start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Travel End</label>
                <p className="text-base text-gray-900">
                  {new Date(request.travel_end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Budget</label>
                <p className="text-lg font-bold text-[#7a0019]">
                  ₱{request.total_budget?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Previous Approvals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Previous Approvals</h4>
              
              {request.head_approved_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Head Approved:</span>
                  <span className="text-green-600 font-medium">
                    {new Date(request.head_approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {request.hr_approved_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">HR Approved:</span>
                  <span className="text-green-600 font-medium">
                    {new Date(request.hr_approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {request.hr_comments && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <p className="text-xs text-gray-500">HR Comments:</p>
                  <p className="text-sm text-gray-700">{request.hr_comments}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            {request.participants && request.participants.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Participants</label>
                <div className="mt-2 space-y-1">
                  {request.participants.map((p: any, i: number) => (
                    <p key={i} className="text-sm text-gray-900">• {p.name}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VP Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VP Signature <span className="text-red-500">*</span>
            </label>
            <div className="relative border-2 border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-[150px] cursor-crosshair"
              />
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Draw your signature above</p>
          </div>

          {/* VP Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VP Notes/Comments
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent resize-none"
              placeholder="Add your comments here..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-5 w-5" />
            {submitting ? "Approving..." : "Approve Request"}
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-5 w-5" />
            {submitting ? "Rejecting..." : "Reject Request"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
