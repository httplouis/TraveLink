/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART TIMELINE COMPONENT v2.1
 * Enhanced Timeline with Auto-Skip Visualization
 * ═══════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { SmartWorkflowEngine, type SmartRequest } from '@/lib/workflow/smart-engine';

interface SmartTimelineProps {
  request: SmartRequest | any;
  mode?: 'compact' | 'detailed';
  showAnalytics?: boolean;
  className?: string;
}

interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  user?: string;
  timestamp?: Date | string;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  icon: string;
  skipReason?: string;
  smartFeature?: boolean;
}

export function SmartTimeline({ 
  request, 
  mode = 'detailed',
  showAnalytics = true,
  className = '' 
}: SmartTimelineProps) {
  
  // 🎯 Generate timeline steps with smart logic
  const generateTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    
    // 📝 Request Submission
    steps.push({
      id: 'submitted',
      title: 'Request Submitted',
      subtitle: request.requester_name || 'Unknown Requester',
      user: request.requester_name,
      timestamp: request.created_at || request.requester_signed_at,
      status: 'completed',
      icon: '📝'
    });
    
    // 👤 Head Approval
    if (request.head_skipped) {
      steps.push({
        id: 'head',
        title: '🎯 Head Approval (Smart Skip)',
        subtitle: request.head_skip_reason || 'Self-request dual-signature',
        user: request.requester_name,
        timestamp: request.head_signed_at || request.created_at,
        status: 'skipped',
        icon: '🎯',
        skipReason: request.head_skip_reason,
        smartFeature: true
      });
    } else if (request.head_signature || request.head_approved_at) {
      steps.push({
        id: 'head',
        title: 'Head Approved',
        subtitle: 'Department head approval',
        user: request.head_approved_by_name || 'Department Head',
        timestamp: request.head_approved_at,
        status: 'completed',
        icon: '👤'
      });
    } else if (request.status === 'pending_head') {
      steps.push({
        id: 'head',
        title: 'Pending Head Approval',
        subtitle: 'Waiting for department head',
        status: 'current',
        icon: '👤'
      });
    } else {
      steps.push({
        id: 'head',
        title: 'Head Approval',
        subtitle: 'Department head review',
        status: 'pending',
        icon: '👤'
      });
    }
    
    // ⚙️ Admin Processing
    if (request.admin_processed_at) {
      steps.push({
        id: 'admin',
        title: 'Admin Processed',
        subtitle: 'Resources assigned and verified',
        user: request.admin_processed_by_name || 'Admin',
        timestamp: request.admin_processed_at,
        status: 'completed',
        icon: '⚙️'
      });
    } else if (request.status === 'pending_admin') {
      steps.push({
        id: 'admin',
        title: 'Pending Admin Processing',
        subtitle: 'Assigning driver and vehicle',
        status: 'current',
        icon: '⚙️'
      });
    } else {
      steps.push({
        id: 'admin',
        title: 'Admin Processing',
        subtitle: 'Resource assignment',
        status: 'pending',
        icon: '⚙️'
      });
    }
    
    // 💰 Comptroller Review
    if (request.comptroller_skipped) {
      const skipReason = request.comptroller_skip_reason || 'No budget requested';
      steps.push({
        id: 'comptroller',
        title: skipReason.includes('budget') ? '🎯 Budget Review (Smart Skip)' : '🎯 Comptroller (Smart Skip)',
        subtitle: skipReason,
        user: skipReason.includes('Self-request') ? request.requester_name : 'System',
        timestamp: request.comptroller_signed_at || request.created_at,
        status: 'skipped',
        icon: '🎯',
        skipReason: skipReason,
        smartFeature: true
      });
    } else if (request.comptroller_approved_at) {
      steps.push({
        id: 'comptroller',
        title: 'Budget Approved',
        subtitle: request.budget_version > 1 ? `Budget modified (v${request.budget_version})` : 'Budget verified',
        user: request.comptroller_approved_by_name || 'Comptroller',
        timestamp: request.comptroller_approved_at,
        status: 'completed',
        icon: '💰'
      });
    } else if (request.status === 'pending_comptroller') {
      steps.push({
        id: 'comptroller',
        title: 'Pending Budget Review',
        subtitle: 'Comptroller reviewing budget',
        status: 'current',
        icon: '💰'
      });
    } else if (request.requires_budget) {
      steps.push({
        id: 'comptroller',
        title: 'Budget Review',
        subtitle: 'Comptroller verification',
        status: 'pending',
        icon: '💰'
      });
    }
    
    // 🔄 HR Budget Acknowledgment (Special substage)
    if (request.hr_budget_ack_required) {
      if (request.hr_budget_ack_at) {
        steps.push({
          id: 'hr_ack',
          title: 'Budget Changes Acknowledged',
          subtitle: 'HR acknowledged comptroller modifications',
          user: request.hr_approved_by_name || 'HR Director',
          timestamp: request.hr_budget_ack_at,
          status: 'completed',
          icon: '🔄'
        });
      } else if (request.status === 'pending_hr_ack') {
        steps.push({
          id: 'hr_ack',
          title: 'Pending Budget Acknowledgment',
          subtitle: 'HR needs to acknowledge budget changes',
          status: 'current',
          icon: '🔄'
        });
      }
    }
    
    // 👥 HR Review
    if (request.hr_skipped) {
      steps.push({
        id: 'hr',
        title: '🎯 HR Review (Smart Skip)',
        subtitle: request.hr_skip_reason || 'Self-request dual-signature',
        user: request.requester_name,
        timestamp: request.hr_signed_at || request.created_at,
        status: 'skipped',
        icon: '🎯',
        skipReason: request.hr_skip_reason,
        smartFeature: true
      });
    } else if (request.hr_approved_at) {
      steps.push({
        id: 'hr',
        title: 'HR Approved',
        subtitle: 'Human resources review completed',
        user: request.hr_approved_by_name || 'HR Director',
        timestamp: request.hr_approved_at,
        status: 'completed',
        icon: '👥'
      });
    } else if (request.status === 'pending_hr') {
      steps.push({
        id: 'hr',
        title: 'Pending HR Review',
        subtitle: 'HR reviewing request',
        status: 'current',
        icon: '👥'
      });
    } else {
      steps.push({
        id: 'hr',
        title: 'HR Review',
        subtitle: 'Human resources approval',
        status: 'pending',
        icon: '👥'
      });
    }
    
    // 👔 Executive Approval
    if (request.exec_skipped) {
      steps.push({
        id: 'executive',
        title: '🎯 Executive Approval (Smart Skip)',
        subtitle: request.exec_skip_reason || 'President self-request',
        user: request.requester_name,
        timestamp: request.exec_signed_at || request.created_at,
        status: 'skipped',
        icon: '🎯',
        skipReason: request.exec_skip_reason,
        smartFeature: true
      });
    } else if (request.exec_approved_at) {
      const execLevel = request.exec_level === 'president' ? 'President' : 'Vice President';
      steps.push({
        id: 'executive',
        title: `${execLevel} Approved`,
        subtitle: 'Executive approval completed',
        user: request.exec_approved_by_name || execLevel,
        timestamp: request.exec_approved_at,
        status: 'completed',
        icon: '👔'
      });
    } else if (request.status === 'pending_exec') {
      const execLevel = request.exec_level === 'president' ? 'President' : 'Vice President';
      steps.push({
        id: 'executive',
        title: `Pending ${execLevel} Approval`,
        subtitle: `Waiting for ${execLevel.toLowerCase()} approval`,
        status: 'current',
        icon: '👔'
      });
    } else {
      steps.push({
        id: 'executive',
        title: 'Executive Approval',
        subtitle: 'Final executive review',
        status: 'pending',
        icon: '👔'
      });
    }
    
    // ✅ Final Status
    if (request.status === 'approved') {
      steps.push({
        id: 'approved',
        title: '✅ Request Approved',
        subtitle: 'All approvals completed successfully',
        timestamp: request.final_approved_at || request.exec_approved_at,
        status: 'completed',
        icon: '✅'
      });
    }
    
    return steps;
  };
  
  const steps = generateTimelineSteps();
  const analytics = SmartWorkflowEngine.getWorkflowAnalytics(request);
  
  // 🎨 Get status styling
  const getStepStyling = (step: TimelineStep) => {
    switch (step.status) {
      case 'completed':
        return {
          circle: 'bg-green-500 border-green-500 text-white',
          line: 'bg-green-300',
          content: 'text-gray-900',
          timestamp: 'text-green-600'
        };
      case 'current':
        return {
          circle: 'bg-blue-500 border-blue-500 text-white animate-pulse',
          line: 'bg-gray-300',
          content: 'text-blue-900 font-medium',
          timestamp: 'text-blue-600'
        };
      case 'skipped':
        return {
          circle: 'bg-gradient-to-r from-purple-500 to-blue-500 border-purple-500 text-white transform rotate-12',
          line: 'bg-purple-300',
          content: 'text-purple-900',
          timestamp: 'text-purple-600'
        };
      default:
        return {
          circle: 'bg-gray-200 border-gray-300 text-gray-500',
          line: 'bg-gray-200',
          content: 'text-gray-600',
          timestamp: 'text-gray-500'
        };
    }
  };
  
  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  if (mode === 'compact') {
    // 📱 Compact horizontal timeline
    return (
      <div className={`flex items-center space-x-2 overflow-x-auto pb-2 ${className}`}>
        {steps.map((step, index) => {
          const styling = getStepStyling(step);
          return (
            <React.Fragment key={step.id}>
              <div 
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full border-2 
                  flex items-center justify-center text-sm
                  transition-all duration-300 cursor-help
                  ${styling.circle}
                `}
                title={`${step.title}${step.subtitle ? ` - ${step.subtitle}` : ''}`}
              >
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-shrink-0 w-4 h-0.5 ${styling.line}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  
  // 📋 Detailed vertical timeline
  return (
    <div className={className}>
      {/* Analytics Header */}
      {showAnalytics && analytics.skipped_stages > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-semibold text-blue-900">Smart Workflow Active</h3>
          </div>
          <div className="text-sm text-blue-800">
            <strong>{analytics.skipped_stages}</strong> stages automatically skipped, 
            saving approximately <strong>{analytics.time_saved_estimate}</strong> 
            ({analytics.efficiency_percentage}% efficiency boost)
          </div>
        </div>
      )}
      
      {/* Timeline Steps */}
      <div className="relative">
        {steps.map((step, index) => {
          const styling = getStepStyling(step);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative flex items-start pb-8">
              {/* Vertical Line */}
              {!isLast && (
                <div className={`
                  absolute left-4 top-8 w-0.5 h-full -ml-px
                  ${styling.line}
                `} />
              )}
              
              {/* Step Circle */}
              <div className={`
                relative z-10 w-8 h-8 rounded-full border-2 
                flex items-center justify-center text-sm font-bold
                transition-all duration-300
                ${styling.circle}
                ${step.smartFeature ? 'shadow-lg' : ''}
              `}>
                {step.icon}
              </div>
              
              {/* Step Content */}
              <div className="ml-4 flex-1 min-w-0">
                <div className={`text-lg font-medium ${styling.content}`}>
                  {step.title}
                  {step.smartFeature && (
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Smart Feature
                    </span>
                  )}
                </div>
                
                {step.subtitle && (
                  <div className="text-sm text-gray-600 mt-1">
                    {step.subtitle}
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {step.user && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">By:</span>
                      <span className="font-medium">{step.user}</span>
                    </div>
                  )}
                  
                  {step.timestamp && (
                    <div className={`${styling.timestamp}`}>
                      {formatTimestamp(step.timestamp)}
                    </div>
                  )}
                </div>
                
                {step.skipReason && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
                    <strong>Skip Reason:</strong> {step.skipReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
