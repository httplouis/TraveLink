// src/components/user/request/ui/HeadEndorsementStatus.tsx
"use client";

import * as React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Mail, Building2 } from "lucide-react";

interface HeadEndorsementInvitation {
  id: string;
  head_email: string;
  head_name?: string;
  department_name?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'expired';
  confirmed_at?: string;
  declined_at?: string;
  signature?: string;
  department?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface HeadEndorsementStatusProps {
  requestId: string;
  onAllConfirmed?: (allConfirmed: boolean) => void;
}

export default function HeadEndorsementStatus({
  requestId,
  onAllConfirmed,
}: HeadEndorsementStatusProps) {
  const [invitations, setInvitations] = React.useState<HeadEndorsementInvitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    expired: 0,
    allConfirmed: false,
  });

  const fetchStatus = React.useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/head-endorsements/status?request_id=${requestId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();

      if (data.ok && data.data) {
        setInvitations(data.data);
        setSummary(data.summary);
        onAllConfirmed?.(data.summary.allConfirmed);
      } else {
        console.error('[HeadEndorsementStatus] Failed to fetch status:', data.error);
      }
    } catch (err) {
      console.error('[HeadEndorsementStatus] Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  }, [requestId, onAllConfirmed]);

  // Poll for updates every 5 seconds
  React.useEffect(() => {
    if (!requestId) return;

    fetchStatus();

    // OPTIMIZED: Reduced frequency from 5s to 30s to minimize egress
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [requestId, fetchStatus]);

  if (!requestId || summary.total === 0) {
    return null; // Don't show if no invitations
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'declined':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'expired':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="mt-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-3 border-b-2 border-blue-200 pb-3">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Head Endorsements</h3>
          <p className="text-sm text-gray-600">
            {summary.allConfirmed 
              ? 'All department heads have endorsed' 
              : `${summary.confirmed} of ${summary.total} heads have endorsed`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-xs text-gray-500 mt-2">Loading endorsements...</p>
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No head endorsements required</p>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(inv.status)}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(inv.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {inv.head_name || inv.head_email || 'Department Head'}
                  </p>
                  <p className="text-xs opacity-80">
                    {inv.department_name || inv.department?.name || 'Department'}
                  </p>
                  {inv.status === 'confirmed' && inv.confirmed_at && (
                    <p className="text-xs opacity-70 mt-1">
                      Confirmed {new Date(inv.confirmed_at).toLocaleDateString()}
                    </p>
                  )}
                  {inv.status === 'pending' && (
                    <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Invitation sent, awaiting response
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!summary.allConfirmed && summary.pending > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Waiting for {summary.pending} head endorsement{summary.pending > 1 ? 's' : ''} before submission.
          </p>
        </div>
      )}
    </div>
  );
}

