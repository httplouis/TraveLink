"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import RequestDetailsView from '@/components/common/RequestDetailsView';
import { WowButton } from '@/components/common/Modal';
import { PageTransition } from '@/components/common/Modal';

interface RequestDetailsPageProps {
  requestId: string;
}

export default function RequestDetailsPage({ requestId }: RequestDetailsPageProps) {
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${requestId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch request details');
      }
      
      const data = await response.json();
      
      // Transform data to match our component interface
      const transformedRequest = {
        id: data.id,
        request_number: data.request_number,
        title: data.title,
        purpose: data.purpose,
        destination: data.destination,
        travel_start_date: data.travel_start_date,
        travel_end_date: data.travel_end_date,
        total_budget: data.total_budget || 0,
        transportation_type: data.transportation_type,
        pickup_location: data.pickup_location,
        pickup_time: data.pickup_time,
        status: data.status,
        
        requester: {
          id: data.requester_id,
          name: data.requester_name || 'Unknown User',
          profile_picture: data.requester_profile_picture,
          department: data.department_name,
          position: data.requester_position,
          email: data.requester_email,
          phone: data.requester_phone
        },
        
        department: {
          id: data.department_id,
          name: data.department_name || 'Unknown Department',
          code: data.department_code
        },
        
        participants: data.participants || [],
        
        // Smart workflow fields
        smart_skips_applied: data.smart_skips_applied || [],
        efficiency_boost: data.efficiency_boost,
        requires_budget: data.requires_budget,
        
        // Mock signatures for now - replace with real data
        signatures: [
          {
            id: 'requester',
            label: 'Requesting Person',
            role: 'Requester',
            status: 'approved',
            approver: {
              id: data.requester_id,
              name: data.requester_name || 'Unknown User',
              profile_picture: data.requester_profile_picture,
              department: data.department_name,
              position: data.requester_position,
              email: data.requester_email
            },
            signature: data.requester_signature,
            approved_at: data.created_at
          },
          {
            id: 'head',
            label: 'Department Head',
            role: 'Head',
            status: data.head_signature ? 'approved' : 
                   data.head_skipped ? 'skipped' : 
                   data.status === 'pending_head' ? 'next' : 'pending',
            approver: data.head_approved_by ? {
              id: data.head_approved_by,
              name: data.head_name || 'Department Head',
              profile_picture: data.head_profile_picture,
              department: data.department_name,
              position: 'Department Head'
            } : undefined,
            signature: data.head_signature,
            approved_at: data.head_approved_at,
            skip_reason: data.head_skip_reason
          },
          {
            id: 'admin',
            label: 'Admin Processing',
            role: 'Admin',
            status: data.admin_signature ? 'approved' : 
                   data.status === 'pending_admin' ? 'next' : 'pending',
            approver: data.admin_processed_by ? {
              id: data.admin_processed_by,
              name: data.admin_name || 'Admin',
              profile_picture: data.admin_profile_picture,
              position: 'Administrator'
            } : undefined,
            signature: data.admin_signature,
            approved_at: data.admin_processed_at
          },
          {
            id: 'comptroller',
            label: 'Budget Review',
            role: 'Comptroller',
            status: !data.requires_budget ? 'skipped' :
                   data.comptroller_signature ? 'approved' : 
                   data.status === 'pending_comptroller' ? 'next' : 'pending',
            approver: data.comptroller_approved_by ? {
              id: data.comptroller_approved_by,
              name: data.comptroller_name || 'Comptroller',
              profile_picture: data.comptroller_profile_picture,
              position: 'Comptroller'
            } : undefined,
            signature: data.comptroller_signature,
            approved_at: data.comptroller_approved_at,
            skip_reason: !data.requires_budget ? 'No budget requested' : undefined
          },
          {
            id: 'hr',
            label: 'HR Review',
            role: 'HR',
            status: data.hr_signature ? 'approved' : 
                   data.hr_skipped ? 'skipped' :
                   data.status === 'pending_hr' ? 'next' : 'pending',
            approver: data.hr_approved_by ? {
              id: data.hr_approved_by,
              name: data.hr_name || 'HR Director',
              profile_picture: data.hr_profile_picture,
              position: 'HR Director'
            } : undefined,
            signature: data.hr_signature,
            approved_at: data.hr_approved_at,
            skip_reason: data.hr_skip_reason
          },
          {
            id: 'executive',
            label: 'Executive Approval',
            role: 'Executive',
            status: data.exec_signature ? 'approved' : 
                   data.exec_skipped ? 'skipped' :
                   data.status === 'pending_exec' ? 'next' : 'pending',
            approver: data.exec_approved_by ? {
              id: data.exec_approved_by,
              name: data.exec_name || 'Executive',
              profile_picture: data.exec_profile_picture,
              position: data.exec_level === 'president' ? 'President' : 'Vice President'
            } : undefined,
            signature: data.exec_signature,
            approved_at: data.exec_approved_at,
            skip_reason: data.exec_skip_reason
          }
        ].filter(stage => {
          // Filter out stages that shouldn't be shown
          if (stage.id === 'comptroller' && !data.requires_budget) {
            return true; // Keep to show as skipped
          }
          return true;
        }),
        
        // Mock timeline for now - replace with real data
        timeline: [
          {
            id: '1',
            type: 'submitted',
            title: 'Request Submitted',
            description: `Travel request ${data.request_number} was submitted for approval`,
            actor: {
              id: data.requester_id,
              name: data.requester_name || 'Unknown User',
              profile_picture: data.requester_profile_picture,
              department: data.department_name,
              position: data.requester_position
            },
            timestamp: data.created_at
          },
          ...(data.head_approved_at ? [{
            id: '2',
            type: 'approved',
            title: 'Head Approval',
            description: 'Department head approved the request',
            actor: {
              id: data.head_approved_by,
              name: data.head_name || 'Department Head',
              profile_picture: data.head_profile_picture,
              department: data.department_name,
              position: 'Department Head'
            },
            timestamp: data.head_approved_at,
            metadata: {
              stage: 'Department Head'
            }
          }] : []),
          ...(data.admin_processed_at ? [{
            id: '3',
            type: 'approved',
            title: 'Admin Processing',
            description: 'Request processed by administrator',
            actor: {
              id: data.admin_processed_by,
              name: data.admin_name || 'Admin',
              profile_picture: data.admin_profile_picture,
              position: 'Administrator'
            },
            timestamp: data.admin_processed_at,
            metadata: {
              stage: 'Admin Processing'
            }
          }] : [])
        ]
      };
      
      setRequest(transformedRequest);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[#7a0019] mx-auto mb-4" />
            <p className="text-gray-600">Loading request details...</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-6"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <WowButton variant="primary" onClick={handleClose}>
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </WowButton>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <WowButton
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to History
                </WowButton>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold text-gray-900">Request Details</h1>
              </div>
              
              <WowButton
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                Print
              </WowButton>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RequestDetailsView
            request={request}
            onPrint={handlePrint}
            onClose={handleClose}
          />
        </div>
      </div>
    </PageTransition>
  );
}
