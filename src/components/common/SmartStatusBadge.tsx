/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART STATUS BADGE COMPONENT v2.1
 * Enhanced Status Indicators with Wow Factor
 * ═══════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { SmartWorkflowEngine, type SmartRequest } from '@/lib/workflow/smart-engine';

interface SmartStatusBadgeProps {
  request: SmartRequest | any; // Allow any for compatibility
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function SmartStatusBadge({ 
  request, 
  size = 'md', 
  showDescription = false,
  className = '' 
}: SmartStatusBadgeProps) {
  
  // 🎯 Get smart status information
  const statusInfo = SmartWorkflowEngine.getSmartStatusInfo(request);
  
  // 📊 Get workflow analytics
  const analytics = SmartWorkflowEngine.getWorkflowAnalytics(request);
  
  // 🎨 Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  // 🌟 Animation classes for wow factor
  const animationClasses = analytics.skipped_stages > 0 
    ? 'animate-pulse hover:animate-none' 
    : '';
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Main Status Badge */}
      <span 
        className={`
          ${sizeClasses[size]} 
          ${statusInfo.color} 
          ${animationClasses}
          border rounded-full font-medium 
          transition-all duration-200 
          hover:shadow-md cursor-help
        `}
        title={statusInfo.description}
      >
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.text}
      </span>
      
      {/* Smart Features Indicator */}
      {analytics.skipped_stages > 0 && (
        <span 
          className="
            px-2 py-1 text-xs 
            bg-gradient-to-r from-blue-500 to-purple-600 
            text-white rounded-full font-bold
            shadow-lg hover:shadow-xl
            transform hover:scale-105 transition-all duration-200
          "
          title={`Smart Skip: ${analytics.efficiency_percentage}% efficiency boost`}
        >
          ⚡ {analytics.skipped_stages}x
        </span>
      )}
      
      {/* Budget Skip Indicator */}
      {request.comptroller_skipped && request.comptroller_skip_reason?.includes('budget') && (
        <span 
          className="
            px-2 py-1 text-xs 
            bg-green-100 text-green-800 border border-green-200
            rounded-full font-medium
          "
          title="Comptroller stage skipped - No budget requested"
        >
          💰 Skip
        </span>
      )}
      
      {/* HR Acknowledgment Indicator */}
      {request.status === 'pending_hr_ack' && (
        <span 
          className="
            px-2 py-1 text-xs 
            bg-orange-100 text-orange-800 border border-orange-200
            rounded-full font-medium animate-bounce
          "
          title="HR needs to acknowledge budget changes"
        >
          🔄 ACK
        </span>
      )}
      
      {/* Description */}
      {showDescription && (
        <div className="text-xs text-gray-600 max-w-xs">
          {statusInfo.description}
          {analytics.skipped_stages > 0 && (
            <div className="mt-1 text-blue-600 font-medium">
              Time saved: {analytics.time_saved_estimate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART PROGRESS INDICATOR
 * ═══════════════════════════════════════════════════════════════════════
 */

interface SmartProgressProps {
  request: SmartRequest | any;
  showLabels?: boolean;
  className?: string;
}

export function SmartProgressIndicator({ 
  request, 
  showLabels = true,
  className = '' 
}: SmartProgressProps) {
  
  const stages = [
    { key: 'head', label: 'Head', icon: '👤' },
    { key: 'admin', label: 'Admin', icon: '⚙️' },
    { key: 'comptroller', label: 'Budget', icon: '💰' },
    { key: 'hr', label: 'HR', icon: '👥' },
    { key: 'exec', label: 'Executive', icon: '👔' }
  ];
  
  const getStageStatus = (stage: string) => {
    const currentStatus = request.status || '';
    
    // Check if stage was skipped
    if (request[`${stage}_skipped`]) {
      return 'skipped';
    }
    
    // Check if stage has signature/approval
    if (request[`${stage}_signature`] || request[`${stage}_approved_at`]) {
      return 'completed';
    }
    
    // Check if currently at this stage
    if (currentStatus.includes(stage)) {
      return 'current';
    }
    
    // Check if stage is before current (should be completed but isn't)
    const stageOrder = ['head', 'admin', 'comptroller', 'hr', 'exec'];
    const currentIndex = stageOrder.findIndex(s => currentStatus.includes(s));
    const stageIndex = stageOrder.indexOf(stage);
    
    if (stageIndex < currentIndex) {
      return 'completed';
    }
    
    return 'pending';
  };
  
  const getStageClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500 animate-pulse';
      case 'skipped':
        return 'bg-gradient-to-r from-purple-400 to-blue-400 text-white border-purple-400';
      default:
        return 'bg-gray-200 text-gray-500 border-gray-300';
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {stages.map((stage, index) => {
        const status = getStageStatus(stage.key);
        const isSkipped = status === 'skipped';
        
        return (
          <React.Fragment key={stage.key}>
            {/* Stage Circle */}
            <div className="flex flex-col items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  text-xs font-bold transition-all duration-300
                  ${getStageClasses(status)}
                  ${isSkipped ? 'transform rotate-12' : ''}
                `}
                title={
                  isSkipped 
                    ? `${stage.label} - Smart Skip Applied` 
                    : `${stage.label} - ${status}`
                }
              >
                {isSkipped ? '🎯' : stage.icon}
              </div>
              
              {showLabels && (
                <span className={`
                  text-xs mt-1 font-medium
                  ${status === 'completed' ? 'text-green-600' : ''}
                  ${status === 'current' ? 'text-blue-600' : ''}
                  ${status === 'skipped' ? 'text-purple-600' : ''}
                  ${status === 'pending' ? 'text-gray-500' : ''}
                `}>
                  {isSkipped ? 'Skip' : stage.label}
                </span>
              )}
            </div>
            
            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className={`
                flex-1 h-0.5 transition-all duration-300
                ${status === 'completed' || status === 'skipped' 
                  ? 'bg-green-300' 
                  : 'bg-gray-300'
                }
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART ANALYTICS WIDGET
 * ═══════════════════════════════════════════════════════════════════════
 */

interface SmartAnalyticsProps {
  request: SmartRequest | any;
  className?: string;
}

export function SmartAnalyticsWidget({ request, className = '' }: SmartAnalyticsProps) {
  const analytics = SmartWorkflowEngine.getWorkflowAnalytics(request);
  
  if (analytics.skipped_stages === 0) {
    return null; // Don't show if no smart features used
  }
  
  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-purple-50 
      border border-blue-200 rounded-lg p-4 
      ${className}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎯</span>
        <h3 className="font-semibold text-blue-900">Smart Workflow Analytics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.skipped_stages}
          </div>
          <div className="text-gray-600">Stages Skipped</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.efficiency_percentage}%
          </div>
          <div className="text-gray-600">Efficiency</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.time_saved_estimate}
          </div>
          <div className="text-gray-600">Time Saved</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {analytics.smart_features_used.length}
          </div>
          <div className="text-gray-600">Smart Features</div>
        </div>
      </div>
      
      {analytics.smart_features_used.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Features Used:</div>
          <div className="flex flex-wrap gap-1">
            {analytics.smart_features_used.map((feature, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
