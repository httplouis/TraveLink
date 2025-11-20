"use client";

import React, { useState, useEffect } from "react";
import { X, Download, MapPin, Calendar, DollarSign, User, Building2, CheckCircle, Clock } from "lucide-react";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
};

export default function ComprehensiveRequestModal({ isOpen, onClose, requestId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestData();
    }
  }, [isOpen, requestId]);

  const fetchRequestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/requests/${requestId}/tracking`);
      const json = await res.json();
      
      if (json.ok) {
        console.log('[ComprehensiveModal] Data received:', json.data);
        console.log('[ComprehensiveModal] Department:', json.data.department);
        console.log('[ComprehensiveModal] Department name:', json.data.department_name);
        console.log('[ComprehensiveModal] DEBUG INFO:', json.data._debug);
        setData(json.data);
      } else {
        setError(json.error || "Failed to load request");
      }
    } catch (err: any) {
      console.error("Error fetching request:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-order-${data?.request_number || requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    
    let isoString = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      isoString = dateStr + 'Z';
    }
    
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      timeZone: "Asia/Manila"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7a0019] to-[#5a0010] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Request Details</h2>
            {data && (
              <p className="text-sm text-white/80 mt-1">{data.request_number}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchRequestData}
                className="mt-4 px-4 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-[#5a0010]"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {data.status === 'approved' ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                      <span className="font-semibold text-green-900">Request Approved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-700" />
                      <span className="font-semibold text-yellow-900">Pending Approval</span>
                    </div>
                  )}
                </div>
                {data.status === 'approved' && data.final_approved_at && (
                  <p className="text-sm text-gray-600">
                    Approved on {formatDate(data.final_approved_at)}
                  </p>
                )}
              </div>

              {/* Request Information */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Request Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Requester</p>
                      <p className="text-sm font-medium text-gray-900">{data.requester_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Department</p>
                      <p className="text-sm font-medium text-gray-900">
                        {data.department_name || data.department?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Destination</p>
                      <p className="text-sm font-medium text-gray-900">{data.destination || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Travel Dates</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(data.travel_start_date)} - {formatDate(data.travel_end_date)}
                      </p>
                    </div>
                  </div>

                  {data.has_budget && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Budget</p>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{data.total_budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Purpose</p>
                  <p className="text-sm text-gray-900">{data.purpose || 'N/A'}</p>
                </div>
              </div>

              {/* Approval Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Approval Timeline</h3>
                <RequestStatusTracker
                  status={data.status}
                  requesterIsHead={data.requester_is_head}
                  hasBudget={data.has_budget}
                  hasParentHead={data.has_parent_head}
                  requiresPresidentApproval={data.requires_president_approval}
                  bothVpsApproved={data.both_vps_approved || false}
                  headApprovedAt={data.head_approved_at}
                  headApprovedBy={data.head_approved_by}
                  parentHeadApprovedAt={data.parent_head_approved_at}
                  parentHeadApprovedBy={data.parent_head_approved_by}
                  adminProcessedAt={data.admin_processed_at}
                  adminProcessedBy={data.admin_processed_by}
                  comptrollerApprovedAt={data.comptroller_approved_at}
                  comptrollerApprovedBy={data.comptroller_approved_by}
                  hrApprovedAt={data.hr_approved_at}
                  hrApprovedBy={data.hr_approved_by}
                  vpApprovedAt={data.vp_approved_at}
                  vpApprovedBy={data.vp_approved_by}
                  vp2ApprovedAt={data.vp2_approved_at}
                  vp2ApprovedBy={data.vp2_approved_by}
                  presidentApprovedAt={data.president_approved_at}
                  presidentApprovedBy={data.president_approved_by}
                  execApprovedAt={data.exec_approved_at}
                  execApprovedBy={data.exec_approved_by}
                  rejectedAt={data.rejected_at}
                  rejectedBy={data.rejected_by}
                  rejectionStage={data.rejection_stage}
                />
              </div>

              {/* Comments & Notes */}
              {(data.head_comments || data.admin_comments || data.comptroller_comments ||
                data.hr_comments || data.vp_comments || data.president_comments || data.exec_comments || data.rejection_reason) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Comments & Notes</h3>
                  <div className="space-y-3">
                    {data.head_comments && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Department Head</p>
                        <p className="text-sm text-blue-900">{data.head_comments}</p>
                      </div>
                    )}
                    {data.admin_comments && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 uppercase mb-1">Admin</p>
                        <p className="text-sm text-purple-900">{data.admin_comments}</p>
                      </div>
                    )}
                    {data.comptroller_comments && (
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                        <p className="text-xs font-semibold text-orange-900 uppercase mb-1">Comptroller</p>
                        <p className="text-sm text-orange-900">{data.comptroller_comments}</p>
                      </div>
                    )}
                    {data.hr_comments && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                        <p className="text-xs font-semibold text-green-900 uppercase mb-1">HR</p>
                        <p className="text-sm text-green-900">{data.hr_comments}</p>
                      </div>
                    )}
                    {data.vp_comments && (
                      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded">
                        <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">Vice President</p>
                        <p className="text-sm text-indigo-900">{data.vp_comments}</p>
                      </div>
                    )}
                    {data.president_comments && (
                      <div className="bg-purple-50 border-l-4 border-purple-600 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 uppercase mb-1">President</p>
                        <p className="text-sm text-purple-900">{data.president_comments}</p>
                      </div>
                    )}
                    {data.exec_comments && (
                      <div className="bg-pink-50 border-l-4 border-pink-500 p-3 rounded">
                        <p className="text-xs font-semibold text-pink-900 uppercase mb-1">Executive</p>
                        <p className="text-sm text-pink-900">{data.exec_comments}</p>
                      </div>
                    )}
                    {data.rejection_reason && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-xs font-semibold text-red-900 uppercase mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-900">{data.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            All timestamps shown in Philippine Time (UTC+8)
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
