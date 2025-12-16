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
      
      const responseData = await response.json();
      const data = responseData.data || responseData; // Handle both {ok: true, data: {...}} and direct data
      
      // Extract nested approver data
      const requester = data.requester || {};
      const headApprover = data.head_approver || {};
      const parentHeadApprover = data.parent_head_approver || {};
      const adminApprover = data.admin_approver || {};
      const comptrollerApprover = data.comptroller_approver || {};
      const hrApprover = data.hr_approver || {};
      const vpApprover = data.vp_approver || {};
      const vp2Approver = data.vp2_approver || {};
      const presidentApprover = data.president_approver || {};
      const execApprover = data.exec_approver || {};
      const department = data.department || {};
      const requesterDept = requester.department || {};
      
      // Transform data to match our component interface
      const transformedRequest = {
        id: data.id,
        request_number: data.request_number,
        file_code: data.file_code, // Log book file code
        title: data.title,
        purpose: data.purpose,
        destination: data.destination,
        travel_start_date: data.travel_start_date,
        travel_end_date: data.travel_end_date,
        total_budget: data.total_budget || 0,
        expense_breakdown: data.expense_breakdown || [],
        transportation_type: data.transportation_type,
        pickup_preference: data.pickup_preference,
        pickup_location: data.pickup_location,
        pickup_time: data.pickup_time,
        pickup_contact_number: data.pickup_contact_number,
        requester_contact_number: data.requester_contact_number,
        status: data.status,
        created_at: data.created_at,
        cost_justification: data.cost_justification,
        preferred_vehicle: data.preferred_vehicle_name || data.preferred_vehicle,
        preferred_driver: data.preferred_driver_name || data.preferred_driver,
        preferred_vehicle_note: data.preferred_vehicle_note,
        preferred_driver_note: data.preferred_driver_note,
        
        requester: {
          id: requester.id || data.requester_id,
          name: requester.name || 'Unknown User',
          profile_picture: requester.profile_picture,
          department: requesterDept.name || department.name || 'Unknown Department',
          position: requester.position_title,
          email: requester.email,
          phone: requester.phone_number
        },
        
        department: {
          id: department.id || data.department_id,
          name: department.name || 'Unknown Department',
          code: department.code
        },
        
        participants: data.participants || [],
        
        // Smart workflow fields
        smart_skips_applied: data.smart_skips_applied || [],
        efficiency_boost: data.efficiency_boost,
        requires_budget: data.requires_budget || data.has_budget,
        
        // Seminar data
        request_type: data.request_type || 'travel_order',
        seminar_data: (() => {
          if (data.seminar_data) {
            if (typeof data.seminar_data === 'string') {
              try {
                return JSON.parse(data.seminar_data);
              } catch (e) {
                console.warn('[RequestDetailsPage] Failed to parse seminar_data:', e);
                return null;
              }
            }
            return data.seminar_data;
          }
          return null;
        })(),
        seminar_code_per_person: (() => {
          if (data.seminar_code_per_person) {
            if (typeof data.seminar_code_per_person === 'string') {
              try {
                return JSON.parse(data.seminar_code_per_person);
              } catch (e) {
                console.warn('[RequestDetailsPage] Failed to parse seminar_code_per_person:', e);
                return [];
              }
            }
            return data.seminar_code_per_person;
          }
          return [];
        })(),
        // Attachments
        attachments: (() => {
          if (data.attachments) {
            if (typeof data.attachments === 'string') {
              try {
                return JSON.parse(data.attachments);
              } catch (e) {
                console.warn('[RequestDetailsPage] Failed to parse attachments:', e);
                return [];
              }
            }
            return data.attachments;
          }
          return [];
        })(),
        
        // Head endorsement invitations (for multi-department requests)
        head_endorsements: data.head_endorsements || [],
        
        // Build signature stages with real data
        signatures: [
          {
            id: 'requester',
            label: 'Requesting Person',
            role: 'Requester',
            status: 'approved',
            approver: {
              id: requester.id || data.requester_id,
              name: requester.name || 'Unknown User',
              profile_picture: requester.profile_picture,
              department: requesterDept.name || department.name,
              position: requester.position_title,
              email: requester.email,
              phone: requester.phone_number
            },
            signature: data.requester_signature,
            approved_at: data.requester_signed_at || data.created_at
          },
          {
            id: 'head',
            label: data.parent_head_approved_at ? 'Parent Department Head' : 'Department Head',
            role: 'Head',
            status: (data.head_signature || data.parent_head_signature) ? 'approved' : 
                   data.head_skipped ? 'skipped' : 
                   (data.status === 'pending_head' || data.status === 'pending_parent_head') ? 'next' : 'pending',
            approver: (() => {
              // Priority: parent_head_approver > head_approver
              const approver = data.parent_head_approved_by ? parentHeadApprover : headApprover;
              const hasApproval = !!(data.head_approved_by || data.parent_head_approved_by);
              
              if (hasApproval && approver && approver.id) {
                return {
                  id: approver.id,
                  name: approver.name || 'Department Head',
                  profile_picture: approver.profile_picture,
                  department: approver.department?.name || department.name,
                  position: approver.position_title || 'Department Head',
                  email: approver.email,
                  phone: approver.phone_number
                };
              }
              return undefined;
            })(),
            signature: data.parent_head_signature || data.head_signature,
            approved_at: data.parent_head_approved_at || data.head_approved_at || data.head_signed_at,
            skip_reason: data.head_skip_reason,
            comments: data.parent_head_comments || data.head_comments
          },
          // Parent Head (if exists - for office hierarchy)
          ...(data.parent_head_approved_by ? [{
            id: 'parent_head',
            label: 'Parent Department Head',
            role: 'Parent Head',
            status: data.parent_head_signature ? 'approved' : 
                   data.status === 'pending_parent_head' ? 'next' : 'pending',
            approver: data.parent_head_approver && data.parent_head_approver.id ? {
              id: data.parent_head_approver.id,
              name: data.parent_head_approver.name || 'Parent Department Head',
              profile_picture: data.parent_head_approver.profile_picture,
              department: data.parent_head_approver.department?.name || department.name,
              position: data.parent_head_approver.position_title || 'Parent Department Head',
              email: data.parent_head_approver.email,
              phone: data.parent_head_approver.phone_number
            } : undefined,
            signature: data.parent_head_signature,
            approved_at: data.parent_head_approved_at,
            comments: data.parent_head_comments
          }] : []),
          {
            id: 'admin',
            label: 'Transportation Management',
            role: 'Transportation Management',
            status: data.admin_signature || data.admin_processed_at ? 'approved' : 
                   data.status === 'pending_admin' ? 'next' : 'pending',
            approver: data.admin_processed_by && adminApprover.id ? {
              id: adminApprover.id,
              name: adminApprover.name || 'Transportation Management',
              profile_picture: adminApprover.profile_picture,
              position: adminApprover.position_title || 'Transportation Manager',
              email: adminApprover.email,
              phone: adminApprover.phone_number
            } : undefined,
            signature: data.admin_signature,
            approved_at: data.admin_processed_at || data.admin_signed_at,
            comments: data.admin_comments || data.admin_notes
          },
          {
            id: 'comptroller',
            label: 'Budget Review',
            role: 'Comptroller',
            status: !data.requires_budget && !data.has_budget ? 'skipped' :
                   data.comptroller_signature ? 'approved' : 
                   data.status === 'pending_comptroller' ? 'next' : 'pending',
            approver: data.comptroller_approved_by && comptrollerApprover.id ? {
              id: comptrollerApprover.id,
              name: comptrollerApprover.name || 'Comptroller',
              profile_picture: comptrollerApprover.profile_picture,
              position: comptrollerApprover.position_title || 'Comptroller',
              email: comptrollerApprover.email,
              phone: comptrollerApprover.phone_number
            } : undefined,
            signature: data.comptroller_signature,
            approved_at: data.comptroller_approved_at || data.comptroller_signed_at,
            skip_reason: !data.requires_budget && !data.has_budget ? 'No budget requested' : undefined,
            comments: data.comptroller_comments
          },
          {
            id: 'hr',
            label: 'HR Review',
            role: 'HR',
            status: data.hr_signature ? 'approved' : 
                   data.hr_skipped ? 'skipped' :
                   data.status === 'pending_hr' ? 'next' : 'pending',
            approver: data.hr_approved_by && hrApprover.id ? {
              id: hrApprover.id,
              name: hrApprover.name || 'HR Director',
              profile_picture: hrApprover.profile_picture,
              position: hrApprover.position_title || 'HR Director',
              email: hrApprover.email,
              phone: hrApprover.phone_number
            } : undefined,
            signature: data.hr_signature,
            approved_at: data.hr_approved_at || data.hr_signed_at,
            skip_reason: data.hr_skip_reason,
            comments: data.hr_comments
          },
          {
            id: 'vp',
            label: 'Vice President',
            role: 'VP',
            status: data.vp_signature ? 'approved' : 
                   data.status === 'pending_exec' && data.exec_level === 'vp' ? 'next' : 'pending',
            approver: data.vp_approved_by && vpApprover.id ? {
              id: vpApprover.id,
              name: vpApprover.name || 'Vice President',
              profile_picture: vpApprover.profile_picture,
              position: vpApprover.position_title || 'Vice President',
              email: vpApprover.email,
              phone: vpApprover.phone_number
            } : undefined,
            signature: data.vp_signature,
            approved_at: data.vp_approved_at,
            comments: data.vp_comments
          },
          // Second VP (if both VPs approved - for multi-department requests)
          ...(data.both_vps_approved && data.vp2_approved_by ? [{
            id: 'vp2',
            label: 'Second Vice President',
            role: 'VP',
            status: data.vp2_signature ? 'approved' : 'pending',
            approver: data.vp2_approved_by && vp2Approver.id ? {
              id: vp2Approver.id,
              name: vp2Approver.name || 'Second Vice President',
              profile_picture: vp2Approver.profile_picture,
              position: vp2Approver.position_title || 'Vice President',
              email: vp2Approver.email,
              phone: vp2Approver.phone_number
            } : undefined,
            signature: data.vp2_signature,
            approved_at: data.vp2_approved_at,
            comments: data.vp2_comments
          }] : []),
          {
            id: 'president',
            label: 'President',
            role: 'President',
            status: data.president_signature ? 'approved' : 
                   data.status === 'pending_exec' && data.exec_level === 'president' ? 'next' : 'pending',
            approver: data.president_approved_by && presidentApprover.id ? {
              id: presidentApprover.id,
              name: presidentApprover.name || 'President',
              profile_picture: presidentApprover.profile_picture,
              position: presidentApprover.position_title || 'President',
              email: presidentApprover.email,
              phone: presidentApprover.phone_number
            } : undefined,
            signature: data.president_signature,
            approved_at: data.president_approved_at,
            comments: data.president_comments
          },
          {
            id: 'executive',
            label: 'Executive Approval',
            role: 'Executive',
            status: data.exec_signature ? 'approved' : 
                   data.exec_skipped ? 'skipped' :
                   data.status === 'pending_exec' ? 'next' : 'pending',
            approver: data.exec_approved_by && execApprover.id ? {
              id: execApprover.id,
              name: execApprover.name || 'Executive',
              profile_picture: execApprover.profile_picture,
              position: execApprover.position_title || (data.exec_level === 'president' ? 'President' : 'Vice President'),
              email: execApprover.email,
              phone: execApprover.phone_number
            } : undefined,
            signature: data.exec_signature,
            approved_at: data.exec_approved_at || data.exec_signed_at,
            skip_reason: data.exec_skip_reason,
            comments: data.exec_comments
          }
        ].filter(stage => {
          // Show comptroller even if skipped (to show skip reason)
          return true;
        }),
        
        // Build timeline from actual data
        timeline: [
          {
            id: 'submitted',
            type: 'submitted',
            title: 'Request Submitted',
            description: `Travel request ${data.request_number} was submitted for approval`,
            actor: {
              id: requester.id || data.requester_id,
              name: requester.name || 'Unknown User',
              profile_picture: requester.profile_picture,
              department: requesterDept.name || department.name,
              position: requester.position_title
            },
            timestamp: data.created_at
          },
          ...(data.head_approved_at && headApprover.id ? [{
            id: 'head-approved',
            type: 'approved',
            title: 'Department Head Approved',
            description: data.head_comments || 'Department head approved the request',
            actor: {
              id: headApprover.id,
              name: headApprover.name || 'Department Head',
              profile_picture: headApprover.profile_picture,
              department: headApprover.department?.name || department.name,
              position: headApprover.position_title || 'Department Head'
            },
            timestamp: data.head_approved_at,
            metadata: {
              stage: 'Department Head',
              comments: data.head_comments
            }
          }] : []),
          ...(data.admin_processed_at && adminApprover.id ? [{
            id: 'admin-processed',
            type: 'approved',
            title: 'Transportation Management Processed',
            description: data.admin_comments || data.admin_notes || 'Request processed by Transportation Management',
            actor: {
              id: adminApprover.id,
              name: adminApprover.name || 'Transportation Management',
              profile_picture: adminApprover.profile_picture,
              position: adminApprover.position_title || 'Transportation Manager'
            },
            timestamp: data.admin_processed_at,
            metadata: {
              stage: 'Transportation Management Processing',
              comments: data.admin_comments || data.admin_notes
            }
          }] : []),
          ...(data.comptroller_approved_at && comptrollerApprover.id ? [{
            id: 'comptroller-approved',
            type: 'approved',
            title: 'Budget Reviewed',
            description: data.comptroller_comments || 'Budget reviewed and approved',
            actor: {
              id: comptrollerApprover.id,
              name: comptrollerApprover.name || 'Comptroller',
              profile_picture: comptrollerApprover.profile_picture,
              position: comptrollerApprover.position_title || 'Comptroller'
            },
            timestamp: data.comptroller_approved_at,
            metadata: {
              stage: 'Comptroller',
              comments: data.comptroller_comments,
              budget_edited: data.comptroller_edited_budget ? `Budget adjusted to ₱${data.comptroller_edited_budget}` : undefined
            }
          }] : []),
          ...(data.hr_approved_at && hrApprover.id ? [{
            id: 'hr-approved',
            type: 'approved',
            title: 'HR Approved',
            description: data.hr_comments || 'HR review completed',
            actor: {
              id: hrApprover.id,
              name: hrApprover.name || 'HR Director',
              profile_picture: hrApprover.profile_picture,
              position: hrApprover.position_title || 'HR Director'
            },
            timestamp: data.hr_approved_at,
            metadata: {
              stage: 'HR',
              comments: data.hr_comments
            }
          }] : []),
          ...(data.vp_approved_at && vpApprover.id ? [{
            id: 'vp-approved',
            type: 'approved',
            title: 'Vice President Approved',
            description: data.vp_comments || 'Vice President approved the request',
            actor: {
              id: vpApprover.id,
              name: vpApprover.name || 'Vice President',
              profile_picture: vpApprover.profile_picture,
              position: vpApprover.position_title || 'Vice President'
            },
            timestamp: data.vp_approved_at,
            metadata: {
              stage: 'VP',
              comments: data.vp_comments
            }
          }] : []),
          ...(data.president_approved_at && presidentApprover.id ? [{
            id: 'president-approved',
            type: 'approved',
            title: 'President Approved',
            description: data.president_comments || 'President approved the request',
            actor: {
              id: presidentApprover.id,
              name: presidentApprover.name || 'President',
              profile_picture: presidentApprover.profile_picture,
              position: presidentApprover.position_title || 'President'
            },
            timestamp: data.president_approved_at,
            metadata: {
              stage: 'President',
              comments: data.president_comments
            }
          }] : []),
          ...(data.exec_approved_at && execApprover.id ? [{
            id: 'exec-approved',
            type: 'approved',
            title: 'Executive Approved',
            description: data.exec_comments || 'Executive approval completed',
            actor: {
              id: execApprover.id,
              name: execApprover.name || 'Executive',
              profile_picture: execApprover.profile_picture,
              position: execApprover.position_title || 'Executive'
            },
            timestamp: data.exec_approved_at,
            metadata: {
              stage: 'Executive',
              comments: data.exec_comments
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
