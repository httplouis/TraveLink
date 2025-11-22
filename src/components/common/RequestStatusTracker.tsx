"use client";

import React from "react";
import { 
  Check, 
  Clock, 
  X, 
  User, 
  Shield, 
  DollarSign, 
  Users, 
  Award,
  FileCheck,
  AlertCircle,
  Zap
} from "lucide-react";

type RequestStatus = 
  | "draft"
  | "pending_head"
  | "pending_parent_head"
  | "pending_admin"
  | "pending_comptroller"
  | "pending_hr"
  | "pending_vp"
  | "pending_president"
  | "pending_exec"
  | "approved"
  | "rejected"
  | "cancelled";

interface ApprovalStage {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  role: string;
}

interface RequestStatusTrackerProps {
  status: RequestStatus;
  requesterIsHead?: boolean;
  hasBudget?: boolean;
  hasParentHead?: boolean;
  requiresPresidentApproval?: boolean;
  bothVpsApproved?: boolean; // Whether both VPs need to approve
  
  // Skip flags
  adminSkipped?: boolean;
  comptrollerSkipped?: boolean;
  adminSkipReason?: string | null;
  comptrollerSkipReason?: string | null;
  
  // Approval timestamps and names
  headApprovedAt?: string | null | undefined;
  headApprovedBy?: string | null | undefined;
  parentHeadApprovedAt?: string | null | undefined;
  parentHeadApprovedBy?: string | null | undefined;
  adminProcessedAt?: string | null | undefined;
  adminProcessedBy?: string | null | undefined;
  comptrollerApprovedAt?: string | null | undefined;
  comptrollerApprovedBy?: string | null | undefined;
  hrApprovedAt?: string | null | undefined;
  hrApprovedBy?: string | null | undefined;
  vpApprovedAt?: string | null | undefined;
  vpApprovedBy?: string | null | undefined;
  vp2ApprovedAt?: string | null | undefined;
  vp2ApprovedBy?: string | null | undefined;
  presidentApprovedAt?: string | null | undefined;
  presidentApprovedBy?: string | null | undefined;
  execApprovedAt?: string | null | undefined;
  execApprovedBy?: string | null | undefined;
  
  rejectedAt?: string | null | undefined;
  rejectedBy?: string | null | undefined;
  rejectionStage?: string | null | undefined;
  
  compact?: boolean;
}

const STAGES: ApprovalStage[] = [
  { key: "head", label: "Department Head", icon: User, role: "Head" },
  { key: "parent_head", label: "College Dean", icon: Award, role: "Dean" },
  { key: "admin", label: "Transportation Coordinator", icon: Shield, role: "Transportation Coordinator" },
  { key: "comptroller", label: "Comptroller", icon: DollarSign, role: "Comptroller" },
  { key: "hr", label: "Human Resources", icon: Users, role: "HR" },
  { key: "vp", label: "Vice President", icon: Award, role: "VP" },
  { key: "vp2", label: "Second Vice President", icon: Award, role: "VP2" },
  { key: "president", label: "President", icon: FileCheck, role: "President" },
];

export default function RequestStatusTracker({
  status,
  requesterIsHead = false,
  hasBudget = false,
  hasParentHead = false,
  requiresPresidentApproval = false,
  bothVpsApproved = false,
  adminSkipped = false,
  comptrollerSkipped = false,
  adminSkipReason = null,
  comptrollerSkipReason = null,
  headApprovedAt,
  headApprovedBy,
  parentHeadApprovedAt,
  parentHeadApprovedBy,
  adminProcessedAt,
  adminProcessedBy,
  comptrollerApprovedAt,
  comptrollerApprovedBy,
  hrApprovedAt,
  hrApprovedBy,
  vpApprovedAt,
  vpApprovedBy,
  vp2ApprovedAt,
  vp2ApprovedBy,
  presidentApprovedAt,
  presidentApprovedBy,
  execApprovedAt,
  execApprovedBy,
  rejectedAt,
  rejectedBy,
  rejectionStage,
  compact = false,
}: RequestStatusTrackerProps) {
  
  // Debug logging
  console.log("[RequestStatusTracker] Props received:", {
    status,
    headApprovedAt,
    headApprovedBy,
    adminProcessedAt,
    adminProcessedBy,
    comptrollerApprovedAt,
    comptrollerApprovedBy,
    hrApprovedAt,
    hrApprovedBy,
    execApprovedAt,
    execApprovedBy,
  });
  
  // Filter stages based on workflow
  // Show skipped stages with visual indicators
  const activeStages = STAGES.filter(stage => {
    if (stage.key === "head" && requesterIsHead) return false;
    if (stage.key === "parent_head" && !hasParentHead) return false;
    // Show comptroller even if skipped (with skip indicator)
    // if (stage.key === "comptroller" && !hasBudget && !comptrollerSkipped) return false;
    if (stage.key === "vp2" && !bothVpsApproved) return false;
    // Always show President if they've already approved, or if approval is required
    if (stage.key === "president" && !requiresPresidentApproval && !presidentApprovedAt) return false;
    return true;
  });

  const getStageStatus = (stageKey: string): "completed" | "current" | "pending" | "rejected" | "skipped" => {
    // Check for skipped stages first
    if (stageKey === "admin" && adminSkipped) return "skipped";
    if (stageKey === "comptroller" && comptrollerSkipped) return "skipped";
    
    if (status === "rejected" && rejectionStage === stageKey) return "rejected";
    if (status === "cancelled") return "rejected";
    
    // If request is fully approved, all stages that have been completed should show as completed
    // Check if we have approval timestamps first
    if (status === "approved") {
      switch (stageKey) {
        case "head": return headApprovedAt ? "completed" : "pending";
        case "parent_head": return parentHeadApprovedAt ? "completed" : "pending";
        case "admin": return adminSkipped ? "skipped" : (adminProcessedAt ? "completed" : "pending");
        case "comptroller": return comptrollerSkipped ? "skipped" : (comptrollerApprovedAt ? "completed" : "pending");
        case "hr": return hrApprovedAt ? "completed" : "pending";
        case "vp": return vpApprovedAt ? "completed" : "pending";
        case "vp2": return vp2ApprovedAt ? "completed" : (bothVpsApproved ? "pending" : "pending");
        case "president": return presidentApprovedAt ? "completed" : "pending";
        case "exec": return execApprovedAt ? "completed" : "pending";
        default: return "pending";
      }
    }
    
    switch (stageKey) {
      case "head":
        if (headApprovedAt) return "completed";
        if (status === "pending_head") return "current";
        // If we're past this stage or request is approved, mark as completed
        if (status === "pending_admin" || status === "pending_comptroller" || status === "pending_hr" || status === "pending_vp" || status === "pending_president" || status === "pending_exec" || status === "approved") return "completed";
        return "pending";
      
      case "parent_head":
        if (parentHeadApprovedAt) return "completed";
        if (status === "pending_parent_head") return "current";
        if (status === "pending_admin" || status === "pending_comptroller" || status === "pending_hr" || status === "pending_vp" || status === "pending_president" || status === "pending_exec" || status === "approved") return "completed";
        return "pending";
      
      case "admin":
        if (adminSkipped) return "skipped";
        if (adminProcessedAt) return "completed";
        if (status === "pending_admin") return "current";
        // If we're past admin stage or request is approved, mark as completed
        if (status === "pending_comptroller" || status === "pending_hr" || status === "pending_vp" || status === "pending_president" || status === "pending_exec" || status === "approved") return "completed";
        return "pending";
      
      case "comptroller":
        if (comptrollerSkipped) return "skipped";
        if (comptrollerApprovedAt) return "completed";
        if (status === "pending_comptroller") return "current";
        if (status === "pending_hr" || status === "pending_vp" || status === "pending_president" || status === "pending_exec" || status === "approved") return "completed";
        return "pending";
      
      case "hr":
        if (hrApprovedAt) return "completed";
        if (status === "pending_hr") return "current";
        if (status === "pending_vp" || status === "pending_president" || status === "pending_exec" || status === "approved") return "completed";
        return "pending";
      
      case "vp":
        if (vpApprovedAt) return "completed";
        if (status === "pending_vp") return "current";
        // If VP2 is needed and first VP approved, mark as completed
        if (bothVpsApproved && vpApprovedAt && !vp2ApprovedAt) return "completed";
        if (status === "pending_president" || status === "approved") return "completed";
        return "pending";
      
      case "vp2":
        if (vp2ApprovedAt) return "completed";
        // If first VP approved but second hasn't, this is current
        if (vpApprovedAt && !vp2ApprovedAt && bothVpsApproved) return "current";
        // If we're past VP2 or request is approved, mark as completed
        if (status === "pending_president" || status === "approved") return "completed";
        return "pending";
      
      case "president":
        if (presidentApprovedAt) return "completed";
        if (status === "pending_president") return "current";
        // If request is approved, check if president approved
        if (status === "approved") return presidentApprovedAt ? "completed" : "pending";
        return "pending";
      
      case "exec":
        if (execApprovedAt) return "completed";
        if (status === "pending_exec") return "current";
        if (status === "approved") return execApprovedAt ? "completed" : "pending";
        return "pending";
      
      default:
        return "pending";
    }
  };

  const getApproverName = (stageKey: string): string | null | undefined => {
    switch (stageKey) {
      case "head": return headApprovedBy;
      case "parent_head": return parentHeadApprovedBy;
      case "admin": return adminProcessedBy;
      case "comptroller": return comptrollerApprovedBy;
      case "hr": return hrApprovedBy;
      case "vp": return vpApprovedBy || execApprovedBy; // Fallback to exec for legacy
      case "vp2": return vp2ApprovedBy;
      case "president": return presidentApprovedBy || execApprovedBy; // Fallback to exec for legacy
      case "exec": return execApprovedBy;
      default: return null;
    }
  };

  const getApprovedAt = (stageKey: string): string | null | undefined => {
    switch (stageKey) {
      case "head": return headApprovedAt;
      case "parent_head": return parentHeadApprovedAt;
      case "admin": return adminProcessedAt;
      case "comptroller": return comptrollerApprovedAt;
      case "hr": return hrApprovedAt;
      case "vp": return vpApprovedAt || execApprovedAt; // Fallback to exec for legacy
      case "vp2": return vp2ApprovedAt;
      case "president": return presidentApprovedAt || execApprovedAt; // Fallback to exec for legacy
      case "exec": return execApprovedAt;
      default: return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return { date: "", time: "" };
    
    // Ensure the date string is treated as UTC if no timezone specified
    let isoString = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      isoString = dateStr + 'Z';
    }
    
    const d = new Date(isoString);
    const date = d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      timeZone: "Asia/Manila"
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila"
    });
    return { date, time };
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {activeStages.map((stage, idx) => {
          const stageStatus = getStageStatus(stage.key);
          const Icon = stage.icon;
          
          return (
            <React.Fragment key={stage.key}>
              <div className="flex items-center gap-1.5">
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs
                  ${stageStatus === "completed" ? "bg-green-500 text-white" : ""}
                  ${stageStatus === "current" ? "bg-blue-500 text-white animate-pulse" : ""}
                  ${stageStatus === "pending" ? "bg-gray-200 text-gray-400" : ""}
                  ${stageStatus === "rejected" ? "bg-red-500 text-white" : ""}
                  ${stageStatus === "skipped" ? "bg-amber-500 text-white" : ""}
                `}>
                  {stageStatus === "completed" && <Check className="w-3 h-3" />}
                  {stageStatus === "current" && <Clock className="w-3 h-3" />}
                  {stageStatus === "rejected" && <X className="w-3 h-3" />}
                  {stageStatus === "skipped" && <Zap className="w-3 h-3" />}
                  {stageStatus === "pending" && <Icon className="w-3 h-3" />}
                </div>
              </div>
              
              {idx < activeStages.length - 1 && (
                <div className={`h-0.5 w-8 ${
                  stageStatus === "completed" ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "rejected" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Request Rejected</p>
            <p className="text-sm text-red-700">
              Rejected at {rejectionStage} stage
              {rejectedBy && ` by ${rejectedBy}`}
              {rejectedAt && (() => {
                const { date, time } = formatDate(rejectedAt);
                return ` on ${date} at ${time}`;
              })()}
            </p>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Request Approved</p>
            <p className="text-sm text-green-700">
              All approvals completed successfully
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activeStages.map((stage, idx) => {
          const stageStatus = getStageStatus(stage.key);
          const Icon = stage.icon;
          const approverName = getApproverName(stage.key);
          const approvedAt = getApprovedAt(stage.key);
          const isLast = idx === activeStages.length - 1;
          
          return (
            <div key={stage.key} className="flex gap-4">
              {/* Icon and connector */}
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-all
                  ${stageStatus === "completed" ? "bg-green-500 text-white" : ""}
                  ${stageStatus === "current" ? "bg-blue-500 text-white ring-4 ring-blue-100" : ""}
                  ${stageStatus === "pending" ? "bg-gray-200 text-gray-400" : ""}
                  ${stageStatus === "rejected" ? "bg-red-500 text-white" : ""}
                  ${stageStatus === "skipped" ? "bg-amber-500 text-white ring-2 ring-amber-200" : ""}
                `}>
                  {stageStatus === "completed" && <Check className="w-5 h-5" />}
                  {stageStatus === "current" && <Clock className="w-5 h-5 animate-pulse" />}
                  {stageStatus === "rejected" && <X className="w-5 h-5" />}
                  {stageStatus === "skipped" && <Zap className="w-5 h-5" />}
                  {stageStatus === "pending" && <Icon className="w-5 h-5" />}
                </div>
                
                {!isLast && (
                  <div className={`w-0.5 h-12 ${
                    stageStatus === "completed" ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-semibold ${
                      stageStatus === "current" ? "text-blue-600" : 
                      stageStatus === "completed" ? "text-gray-900" : 
                      "text-gray-400"
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-sm text-gray-500">{stage.role}</p>
                  </div>
                  
                  <div className="text-right">
                    {stageStatus === "completed" && (
                      <div>
                        {approverName || approvedAt ? (
                          <>
                            {approverName && (
                              <p className="text-sm font-medium text-gray-900">{approverName}</p>
                            )}
                            {approvedAt ? (() => {
                              const { date, time } = formatDate(approvedAt);
                              return (
                                <>
                                  <p className="text-xs text-gray-600">{date}</p>
                                  <p className="text-xs text-gray-500">{time}</p>
                                </>
                              );
                            })() : approverName ? (
                              <p className="text-xs text-gray-500">Time not recorded</p>
                            ) : null}
                            {!approverName && !approvedAt && (
                              <p className="text-sm font-medium text-green-600">✓ Approved</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-green-600">✓ Approved</p>
                            <p className="text-xs text-gray-500">Details not recorded</p>
                          </>
                        )}
                      </div>
                    )}
                    
                    {stageStatus === "current" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    
                    {stageStatus === "skipped" && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          <Zap className="w-3 h-3" />
                          Skipped
                        </span>
                        {(stage.key === "admin" && adminSkipReason) || (stage.key === "comptroller" && comptrollerSkipReason) ? (
                          <p className="text-xs text-amber-600 mt-1 italic">
                            {stage.key === "admin" ? adminSkipReason : comptrollerSkipReason}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-1">
                            {stage.key === "admin" ? "No vehicle needed" : "No budget required"}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {stageStatus === "pending" && (
                      <span className="text-xs text-gray-400">Waiting</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
