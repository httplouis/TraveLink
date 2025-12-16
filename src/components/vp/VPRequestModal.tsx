"use client";

import React, { useState, useEffect } from "react";
import { X, Check, CheckCircle2, XCircle, Users, Car, UserCog, MapPin, Calendar, FileText, Clock, Paperclip, ExternalLink, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";
import SuccessModal from "@/components/common/SuccessModal";
import ReturnToSenderModal from "@/components/common/ReturnToSenderModal";

interface VPRequestModalProps {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  viewOnly?: boolean;
}

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VPRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
  viewOnly = false,
}: VPRequestModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vpSignature, setVpSignature] = useState<string>("");
  const [vpProfile, setVpProfile] = useState<any>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [editedExpenses, setEditedExpenses] = useState<any[]>([]);
  const [originalExpenses, setOriginalExpenses] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [preferredDriverName, setPreferredDriverName] = useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = useState<string>("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApproverSelection, setShowApproverSelection] = useState(false);
  const [approverOptions, setApproverOptions] = useState<any[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [additionalRequesters, setAdditionalRequesters] = React.useState<any[]>([]);
  const [loadingRequesters, setLoadingRequesters] = React.useState(false);
  const [mainRequesterSignature, setMainRequesterSignature] = React.useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [showReturnModal, setShowReturnModal] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);

  const [fullRequest, setFullRequest] = React.useState<any>(null);
  const t = fullRequest || request;

  // Load full request details and VP profile
  const loadFullRequest = async () => {
    try {
      console.log(`[VPRequestModal] 🔍 Starting fetch to /api/requests/${request.id}`);
      const res = await fetch(`/api/requests/${request.id}`);
      console.log(`[VPRequestModal] 📡 Response received:`, {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        url: res.url
      });
      if (!res.ok) {
        console.error("[VPRequestModal] ❌ API response not OK:", res.status, res.statusText);
        const errorText = await res.text();
        // Don't log HTML error pages as errors - they're server errors
        if (!errorText.startsWith('<!DOCTYPE')) {
          console.error("[VPRequestModal] ❌ Error response body:", errorText.substring(0, 500));
        }
        return;
      }
      const contentType = res.headers.get("content-type");
      console.log(`[VPRequestModal] 📄 Content-Type:`, contentType);
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[VPRequestModal] ❌ API returned non-JSON response. Content-Type:", contentType);
        const errorText = await res.text();
        // Don't log HTML error pages as errors - they're server errors
        if (!errorText.startsWith('<!DOCTYPE')) {
          console.error("[VPRequestModal] ❌ Non-JSON response body:", errorText.substring(0, 500));
        }
        return;
      }
      console.log(`[VPRequestModal] ✅ Parsing JSON...`);
      const json = await res.json();
      console.log(`[VPRequestModal] ✅ JSON parsed successfully:`, { ok: json.ok, hasData: !!json.data });
      
      if (json.ok && json.data) {
        setFullRequest(json.data);
        const req = json.data;
        
        // Parse expense_breakdown if it's a string (JSONB from database)
        let expenseBreakdown = req.expense_breakdown;
        if (typeof expenseBreakdown === 'string') {
          try {
            expenseBreakdown = JSON.parse(expenseBreakdown);
          } catch (e) {
            console.error("[VPRequestModal] Failed to parse expense_breakdown:", e);
            expenseBreakdown = null;
          }
        }
        
        // Check if comptroller edited the budget
        const hasComptrollerEdit = req.comptroller_edited_budget && req.comptroller_edited_budget !== req.total_budget;
        
        if (expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
          setExpenseBreakdown(expenseBreakdown);
          
          setEditedExpenses(expenseBreakdown.map((exp: any) => ({
            item: exp.item || exp.description || "Unknown",
            amount: exp.amount || 0,
            description: exp.description || null,
            justification: exp.justification || null
          })));
          
          // Fetch original expense breakdown from request_history if comptroller edited
          let originalExpenseBreakdown: any[] = [];
          if (hasComptrollerEdit) {
            try {
              console.log(`[VPRequestModal] 🔍 Starting fetch to /api/requests/${request.id}/history`);
              const historyRes = await fetch(`/api/requests/${request.id}/history`);
              console.log(`[VPRequestModal] 📡 History response received:`, {
                ok: historyRes.ok,
                status: historyRes.status,
                contentType: historyRes.headers.get("content-type")
              });
              if (!historyRes.ok) {
                console.warn("[VPRequestModal] ❌ History API not OK:", historyRes.status);
                const errorText = await historyRes.text();
                // Don't log HTML error pages as errors - they're server errors
                if (!errorText.startsWith('<!DOCTYPE')) {
                  console.error("[VPRequestModal] ❌ Error response body:", errorText.substring(0, 500));
                }
                return;
              }
              const contentType = historyRes.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                console.warn("[VPRequestModal] ❌ History API returned non-JSON response");
                const errorText = await historyRes.text();
                // Don't log HTML error pages as errors - they're server errors
                if (!errorText.startsWith('<!DOCTYPE')) {
                  console.error("[VPRequestModal] ❌ Non-JSON response body:", errorText.substring(0, 500));
                }
                return;
              }
              console.log(`[VPRequestModal] ✅ Parsing history JSON...`);
              const historyData = await historyRes.json();
              console.log(`[VPRequestModal] ✅ History JSON parsed successfully:`, { ok: historyData?.ok, hasData: !!historyData?.data });
              if (historyData && historyData.ok && historyData.data && historyData.data.history) {
                const budgetModification = historyData.data.history.find((entry: any) => 
                  entry.action === "budget_modified" && entry.metadata?.original_expense_breakdown
                );
                if (budgetModification && budgetModification.metadata?.original_expense_breakdown) {
                  originalExpenseBreakdown = budgetModification.metadata.original_expense_breakdown;
                } else {
                  // Reconstruct original amounts
                  const originalTotal = req.total_budget || 0;
                  const newTotal = req.comptroller_edited_budget || 0;
                  
                  if (originalTotal > 0 && newTotal > 0) {
                    const itemsWithExtractedAmounts: Record<string, number> = {};
                    expenseBreakdown.forEach((exp: any) => {
                      if (exp.justification) {
                        const justification = exp.justification.toLowerCase();
                        const numberMatch = justification.match(/(?:from|original|was|₱|peso|php|mahal\s+ng|mandating)?\s*(\d+(?:\.\d+)?)/i);
                        if (numberMatch && numberMatch[1]) {
                          const extractedAmount = parseFloat(numberMatch[1]);
                          if (extractedAmount > 0 && extractedAmount !== exp.amount) {
                            const itemKey = exp.item || exp.description || "Unknown";
                            itemsWithExtractedAmounts[itemKey] = extractedAmount;
                          }
                        }
                      }
                    });
                    
                    const extractedSum = Object.values(itemsWithExtractedAmounts).reduce((sum, amt) => sum + amt, 0);
                    const itemsWithoutExtracted = expenseBreakdown.filter((exp: any) => {
                      const itemKey = exp.item || exp.description || "Unknown";
                      return !itemsWithExtractedAmounts[itemKey];
                    });
                    
                    const remainingOriginalTotal = Math.max(0, originalTotal - extractedSum);
                    const remainingNewTotal = itemsWithoutExtracted.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
                    const ratio = remainingOriginalTotal > 0 && remainingNewTotal > 0 
                      ? remainingOriginalTotal / remainingNewTotal 
                      : (originalTotal / newTotal);
                    
                    originalExpenseBreakdown = expenseBreakdown.map((exp: any) => {
                      const itemKey = exp.item || exp.description || "Unknown";
                      if (itemsWithExtractedAmounts[itemKey] !== undefined) {
                        return {
                          item: itemKey,
                          amount: itemsWithExtractedAmounts[itemKey],
                          description: exp.description || null
                        };
                      }
                      const proportionalAmount = Math.round((exp.amount || 0) * ratio * 100) / 100;
                      return {
                        item: itemKey,
                        amount: proportionalAmount > 0 ? proportionalAmount : exp.amount,
                        description: exp.description || null
                      };
                    });
                  }
                }
              }
            } catch (err) {
              console.error("[VPRequestModal] Failed to fetch original expense breakdown:", err);
            }
          }
          
          if (hasComptrollerEdit && originalExpenseBreakdown.length > 0) {
            setOriginalExpenses(originalExpenseBreakdown.map((exp: any) => ({
              item: exp.item || exp.description || "Unknown",
              amount: exp.amount || 0,
              description: exp.description || null
            })));
          } else {
            setOriginalExpenses([]);
          }
          
          const total = expenseBreakdown.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          setTotalCost(total || req.total_budget || 0);
        } else {
          if (req.total_budget && req.total_budget > 0) {
            const singleExpense = {
              item: "Total Budget",
              amount: req.total_budget
            };
            setExpenseBreakdown([singleExpense]);
            setEditedExpenses([singleExpense]);
            setOriginalExpenses([]);
            setTotalCost(req.total_budget);
          } else {
            setExpenseBreakdown([]);
            setEditedExpenses([]);
            setOriginalExpenses([]);
            setTotalCost(0);
          }
        }

        // Load preferred driver
        if (req.preferred_driver_id) {
          try {
            console.log(`[VPRequestModal] 🔍 Starting fetch to /api/users/${req.preferred_driver_id}`);
            const driverRes = await fetch(`/api/users/${req.preferred_driver_id}`);
            console.log(`[VPRequestModal] 📡 Driver response received:`, {
              ok: driverRes.ok,
              status: driverRes.status,
              contentType: driverRes.headers.get("content-type")
            });
            if (!driverRes.ok) {
              console.warn("[VPRequestModal] ❌ Driver API not OK:", driverRes.status);
              const errorText = await driverRes.text();
              console.error("[VPRequestModal] ❌ Error response body:", errorText.substring(0, 500));
              return;
            }
            const contentType = driverRes.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn("[VPRequestModal] ❌ Driver API returned non-JSON response");
              const errorText = await driverRes.text();
              console.error("[VPRequestModal] ❌ Non-JSON response body:", errorText.substring(0, 500));
              return;
            }
            console.log(`[VPRequestModal] ✅ Parsing driver JSON...`);
            const driverData = await driverRes.json();
            console.log(`[VPRequestModal] ✅ Driver JSON parsed successfully:`, { ok: driverData?.ok, hasData: !!driverData?.data });
            if (driverData.ok && driverData.data) {
              setPreferredDriverName(driverData.data.name || "Unknown Driver");
            }
          } catch (err) {
            console.error("[VPRequestModal] Failed to load driver:", err);
          }
        }

        // Load preferred vehicle
        if (req.preferred_vehicle_id) {
          try {
            console.log(`[VPRequestModal] 🔍 Starting fetch to /api/vehicles/${req.preferred_vehicle_id}`);
            const vehicleRes = await fetch(`/api/vehicles/${req.preferred_vehicle_id}`);
            console.log(`[VPRequestModal] 📡 Vehicle response received:`, {
              ok: vehicleRes.ok,
              status: vehicleRes.status,
              contentType: vehicleRes.headers.get("content-type")
            });
            if (!vehicleRes.ok) {
              console.warn("[VPRequestModal] ❌ Vehicle API not OK:", vehicleRes.status);
              const errorText = await vehicleRes.text();
              console.error("[VPRequestModal] ❌ Error response body:", errorText.substring(0, 500));
              return;
            }
            const contentType = vehicleRes.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn("[VPRequestModal] ❌ Vehicle API returned non-JSON response");
              const errorText = await vehicleRes.text();
              console.error("[VPRequestModal] ❌ Non-JSON response body:", errorText.substring(0, 500));
              return;
            }
            console.log(`[VPRequestModal] ✅ Parsing vehicle JSON...`);
            const vehicleData = await vehicleRes.json();
            console.log(`[VPRequestModal] ✅ Vehicle JSON parsed successfully:`, { ok: vehicleData?.ok, hasData: !!vehicleData?.data });
            if (vehicleData.ok && vehicleData.data) {
              setPreferredVehicleName(vehicleData.data.name || vehicleData.data.plate_number || "Unknown Vehicle");
            }
          } catch (err) {
            console.error("[VPRequestModal] Failed to load vehicle:", err);
          }
        }
      }
    } catch (err) {
      console.error("[VPRequestModal] Error loading full request:", err);
    }
  };

  const loadAdditionalRequesters = React.useCallback(async () => {
    try {
      setLoadingRequesters(true);
      const t = fullRequest || request;
      
      // Check for additional_requesters, requester_tracking, requester_invitations, or head_endorsements
      const requesters = t?.additional_requesters || t?.requester_tracking || t?.requester_invitations || [];
      
      if (Array.isArray(requesters) && requesters.length > 0) {
        // If requesters have IDs, fetch full details
        const requesterPromises = requesters.map(async (req: any) => {
          if (req.user_id || req.id) {
            try {
              const res = await fetch(`/api/users/${req.user_id || req.id}`);
              if (res.ok) {
                const json = await res.json();
                if (json.ok && json.data) {
                  return {
                    ...req,
                    ...json.data,
                    name: json.data.name || req.name,
                    email: json.data.email || req.email,
                    department: json.data.department?.name || json.data.department?.code || req.department,
                    signature: req.signature || json.data.signature,
                    confirmed_at: req.confirmed_at || req.created_at
                  };
                }
              }
            } catch (err) {
              console.error("[VPRequestModal] Error loading requester:", err);
            }
          }
          return req;
        });
        
        const loadedRequesters = await Promise.all(requesterPromises);
        
        // Find main requester's signature from requester_invitations
        const mainRequester = loadedRequesters.find(r => {
          if (!r) return false;
          return (r.user_id === t?.requester_id) || 
                 (r.user_id === request?.requester_id) ||
                 (r.id === t?.requester_id) ||
                 (r.id === request?.requester_id) ||
                 (r.email === t?.requester?.email) ||
                 (r.email === request?.requester?.email);
        });
        
        if (mainRequester?.signature) {
          console.log("[VPRequestModal] ✅ Found main requester signature from requester_invitations:", {
            name: mainRequester.name,
            email: mainRequester.email,
            signatureLength: mainRequester.signature?.length || 0
          });
          setMainRequesterSignature(mainRequester.signature);
        }
        
        // Filter out the main requester - check both id and user_id
        setAdditionalRequesters(loadedRequesters.filter(r => {
          if (!r) return false;
          const isMainRequester = (r.user_id === t?.requester_id) || (r.id === t?.requester_id);
          return !isMainRequester;
        }));
      } else {
        setAdditionalRequesters([]);
      }
    } catch (err) {
      console.error("[VPRequestModal] Error loading additional requesters:", err);
      setAdditionalRequesters([]);
    } finally {
      setLoadingRequesters(false);
    }
  }, [fullRequest, request]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load current VP info
        console.log("[VPRequestModal] 🔍 Starting fetch to /api/profile");
        const meRes = await fetch("/api/profile");
        console.log("[VPRequestModal] 📡 Profile response received:", {
          ok: meRes.ok,
          status: meRes.status,
          statusText: meRes.statusText,
          contentType: meRes.headers.get("content-type"),
          url: meRes.url
        });
        if (!meRes.ok) {
          console.warn("[VPRequestModal] ❌ Profile API not OK:", meRes.status);
          const errorText = await meRes.text();
          console.error("[VPRequestModal] ❌ Error response body:", errorText.substring(0, 500));
          setVpProfile({ name: "VP User", email: "vp@example.com" });
          return;
        }
        const contentType = meRes.headers.get("content-type");
        console.log("[VPRequestModal] 📄 Profile Content-Type:", contentType);
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("[VPRequestModal] ❌ Profile API returned non-JSON response");
          const errorText = await meRes.text();
          console.error("[VPRequestModal] ❌ Non-JSON response body:", errorText.substring(0, 500));
          setVpProfile({ name: "VP User", email: "vp@example.com" });
          return;
        }
        console.log("[VPRequestModal] ✅ Parsing profile JSON...");
        const meData = await meRes.json();
        console.log("[VPRequestModal] ✅ Profile JSON parsed successfully:", { ok: meData.ok, hasData: !!meData.data });
        if (meData.ok && meData.data) {
          setVpProfile(meData.data);
          // Only set signature if VP has already signed (viewOnly mode)
          if (viewOnly && (meData.data.id === t.vp_approved_by || meData.data.id === t.vp2_approved_by)) {
            setVpSignature(t.vp_signature || t.vp2_signature || "");
          }
        } else {
          console.error("[VPRequestModal] Failed to load profile:", meData);
          setVpProfile({ name: "VP User", email: "vp@example.com" });
        }

        await loadFullRequest();
      } catch (err) {
        console.error("[VPRequestModal] Error loading data:", err);
        setVpProfile({ name: "VP User", email: "vp@example.com" });
      }
    }
    loadData();
  }, [request.id, viewOnly]);

  React.useEffect(() => {
    if (fullRequest || request) {
      loadAdditionalRequesters();
    }
  }, [fullRequest, request, loadAdditionalRequesters]);

  // Check if other VP has already signed
  const otherVPApproved = request.vp_approved_by && request.vp_approved_by !== request.vp2_approved_by;
  const isSecondVP = !!request.vp_approved_by && !request.vp2_approved_by;
  const firstVPName = request.vp_approver?.name || "First VP";

  const doApprove = async () => {
    console.log("[VP] ========== APPROVE BUTTON CLICKED ==========");
    // Open approval modal instead of directly proceeding
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    console.log("[VP] ========== APPROVAL SUBMITTED ==========");
    console.log("[VP] Has signature:", !!vpSignature);
    
    if (!vpSignature) {
      console.log("[VP] No signature - showing error toast");
      toast.error("Signature Required", "Please provide your signature");
      return;
    }
    
    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Notes Required", "Notes are required and must be at least 10 characters long");
      return;
    }
    
    // Close approval modal
    setShowApprovalModal(false);

    // Check if other VP has already signed
    const otherVPApproved = request.vp_approved_by && request.vp_approved_by !== request.vp2_approved_by;
    const isFirstVP = !request.vp_approved_by;
    const isSecondVP = !!request.vp_approved_by && !request.vp2_approved_by;
    const isHeadRequest = request.requester_is_head || false;

    // If requester is head, automatically send to President (no selection needed)
    // If first VP and multiple departments, wait for second VP (no selection needed)
    // Otherwise, show approver selection
    const needsApproverSelection = !isHeadRequest && !(isFirstVP && request.requester_invitations?.length > 1);

    // If head request, automatically proceed to President
    if (isHeadRequest) {
      console.log("[VPRequestModal] Head request detected - automatically sending to President");
      proceedWithApproval(null, "president");
      return;
    }

    if (needsApproverSelection) {
      // Fetch available approvers
      setLoadingApprovers(true);
      try {
        const options: any[] = [];

        // Fetch Presidents
        const presidentRes = await fetch(`/api/approvers/list?role=president`);
        if (presidentRes.ok) {
          const contentType = presidentRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const presidentData = await presidentRes.json();
            if (presidentData.ok && presidentData.data && presidentData.data.length > 0) {
              const presidentOptions = presidentData.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                email: p.email,
                profile_picture: p.profile_picture,
                phone: p.phone,
                position: p.position || "President",
                department: p.department,
                role: "president",
                roleLabel: "President"
              }));
              options.push(...presidentOptions);
            }
          } else {
            console.warn("[VPRequestModal] President approvers API returned non-JSON response");
          }
        }

        // Fetch Admins
        const adminRes = await fetch(`/api/approvers/list?role=admin`);
        if (adminRes.ok) {
          const contentType = adminRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const adminData = await adminRes.json();
            if (adminData.ok && adminData.data && adminData.data.length > 0) {
              const adminOptions = adminData.data.map((a: any) => ({
                id: a.id,
                name: a.name,
                email: a.email,
                profile_picture: a.profile_picture,
                phone: a.phone,
                position: a.position || "Transportation Manager",
                department: a.department,
                role: "admin",
                roleLabel: "Transportation Management"
              }));
              options.push(...adminOptions);
            }
          } else {
            console.warn("[VPRequestModal] Admin approvers API returned non-JSON response");
          }
        }

        setApproverOptions(options);
        setLoadingApprovers(false);
        setShowApproverSelection(true);
      } catch (err) {
        console.error("[VPRequestModal] Error fetching approvers:", err);
        setLoadingApprovers(false);
        setApproverOptions([]);
        setShowApproverSelection(true);
        toast.warning("Warning", "Could not fetch approvers. You can still return the request to the requester.");
      }
      return;
    }

    // If no selection needed, proceed with default
    proceedWithApproval(null, "president");
  };

  const proceedWithApproval = async (selectedApproverId: string | null, selectedRole: string, returnReason?: string) => {
    setSubmitting(true);
    try {
      const isHeadRequest = request.requester_is_head || false;
      
      console.log("[VPRequestModal] Sending approval request:", {
        requestId: request.id,
        action: "approve",
        hasSignature: !!vpSignature,
        notesLength: notes.trim().length,
        isHeadRequest,
        nextApproverId: selectedApproverId,
        nextApproverRole: selectedRole
      });
      
      const res = await fetch("/api/vp/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature: vpSignature,
          notes: notes.trim(),
          is_head_request: isHeadRequest,
          nextApproverId: selectedApproverId,
          nextApproverRole: selectedRole,
          returnReason: returnReason || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[VPRequestModal] API error:", res.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${res.status}` };
        }
        toast.error("Approval Failed", errorData.error || "Failed to approve request");
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("[VPRequestModal] Approval API returned non-JSON response. Response:", errorText.substring(0, 200));
        toast.error("Approval Failed", "Invalid response format from server");
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      if (data.ok) {
        const roleLabel = selectedRole === "requester" ? "Requester" : 
                         selectedRole === "admin" ? "Admin" : 
                         selectedRole === "president" ? "President" : "Next Approver";
        setShowApproverSelection(false);
        setSuccessMessage(`Request approved successfully and sent to ${roleLabel}`);
        setShowSuccessModal(true);
        // Close modal and refresh after success modal closes
        setTimeout(() => {
          onApproved(request.id);
          onClose();
        }, 3000);
      } else {
        toast.error("Approval Failed", data.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Error", "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToSender = async (returnReason: string, comments: string) => {
    if (submitting || isReturning) return;

    try {
      setIsReturning(true);
      const response = await fetch(`/api/requests/${request.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_reason: returnReason, comments }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to return request");
      }

      setShowReturnModal(false);
      setSuccessMessage("The request has been returned to the requester for revision.");
      setShowSuccessModal(true);
      setTimeout(() => {
        onRejected(request.id);
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("[Return Request] Error:", error);
      toast.error(
        "Return Failed",
        error.message || "Failed to return request. Please try again."
      );
    } finally {
      setIsReturning(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Reason Required", "Please provide a reason for rejection (minimum 10 characters)");
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

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[VPRequestModal] Reject API error:", res.status, errorText.substring(0, 200));
        throw new Error(`Failed to reject: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("[VPRequestModal] Reject API returned non-JSON. Response:", errorText.substring(0, 200));
        throw new Error("API returned non-JSON response");
      }

      const data = await res.json();

      if (data.ok) {
        setSuccessMessage("Request rejected successfully");
        setShowSuccessModal(true);
        setTimeout(() => {
          onRejected(request.id);
          onClose();
        }, 3000);
      } else {
        toast.error("Rejection Failed", data.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Error", "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full"></div>
            <p className="text-white font-medium text-lg">Processing...</p>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
        <div className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              VP Review
            </h2>
            {t.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
            {isSecondVP && (
              <div className="mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900">
                  {firstVPName} has already approved this request. Your approval will complete the VP review process.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm ${
              t.status === 'pending_exec' || t.status === 'pending_head' ? 'bg-amber-300/90 text-amber-900 border border-amber-400' :
              t.status === 'approved' ? 'bg-green-300/90 text-green-900 border border-green-400' :
              t.status === 'rejected' ? 'bg-red-300/90 text-red-900 border border-red-400' :
              'bg-white/20 text-white border border-white/30'
            }`}>
              {t.status === 'pending_exec' || t.status === 'pending_head' ? 'Pending Review' :
               t.status === 'approved' ? 'Approved' :
               t.status === 'rejected' ? 'Rejected' :
               t.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Pending'}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Requester Information */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Requesting Person
              </p>
              
              <div className="flex items-start gap-3">
                {(t.requester?.profile_picture || t.requester?.avatar_url) ? (
                  <img 
                    src={t.requester.profile_picture || t.requester.avatar_url} 
                    alt={t.requester_name || "Requester"}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                        fallback.textContent = (t.requester_name || "U").charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(t.requester_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900 mb-1">
                    <NameWithProfile
                      name={t.requester_name || t.requester?.name || t.requester?.email || "Unknown Requester"}
                      profile={{
                        id: t.requester?.id || '',
                        name: t.requester_name || t.requester?.name || '',
                        email: t.requester?.email,
                        department: t.department?.name || t.department?.code,
                        position: t.requester?.position_title,
                        profile_picture: t.requester?.profile_picture,
                      }}
                    />
                  </p>
                  <p className="text-sm text-slate-600">
                    {t.department?.name || t.department?.code || "No department indicated"}
                  </p>
                  {t.requester?.position_title && (
                    <p className="text-xs text-slate-500 mt-0.5">{t.requester.position_title}</p>
                  )}
                  {t.requester?.role && (
                    <p className="text-xs text-slate-500 mt-0.5">Role: {(() => {
                      const role = t.requester.role?.toLowerCase();
                      if (role === 'student') return 'Faculty/Staff';
                      if (role === 'faculty' || role === 'staff') return 'Faculty/Staff';
                      return t.requester.role;
                    })()}</p>
                  )}
                </div>
                {(() => {
                  // Check if requester is also the head approver - if so, use head_signature
                  const requesterId = t?.requester_id || request?.requester_id;
                  const headApprovedBy = t?.head_approved_by || request?.head_approved_by;
                  const isRequesterAlsoHead = requesterId && headApprovedBy && requesterId === headApprovedBy;
                  
                  // Check multiple possible locations for the signature
                  let signatureFromInvitations = null;
                  if (fullRequest?.requester_invitations && Array.isArray(fullRequest.requester_invitations)) {
                    const mainRequesterInvitation = fullRequest.requester_invitations.find((inv: any) => {
                      return (inv.user_id === requesterId) || 
                             (inv.id === requesterId) ||
                             (inv.email === t?.requester?.email) ||
                             (inv.email === request?.requester?.email);
                    });
                    signatureFromInvitations = mainRequesterInvitation?.signature || null;
                  }
                  
                  // Priority: 
                  // 1. If requester is also head, use head_signature
                  // 2. signatureFromInvitations 
                  // 3. mainRequesterSignature 
                  // 4. fullRequest.requester_signature
                  // 5. Other fallbacks
                  const signature = (isRequesterAlsoHead && (fullRequest?.head_signature || request?.head_signature || t?.head_signature))
                    || signatureFromInvitations
                    || mainRequesterSignature
                    || (fullRequest?.requester_signature)
                    || (request?.requester_signature)
                    || (t?.requester_signature)
                    || (fullRequest?.requester?.signature)
                    || (request?.requester?.signature)
                    || (t?.requester?.signature)
                    || (fullRequest as any)?.signature
                    || (request as any)?.signature
                    || (t as any)?.signature;
                  
                  return signature ? (
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500 font-medium">Signature</p>
                      <img
                        src={signature}
                        alt={`${t?.requester_name || request?.requester_name || "Requester"}'s signature`}
                        className="h-16 w-32 rounded border border-slate-300 bg-white object-contain p-1"
                        onError={(e) => {
                          console.error("[VPRequestModal] Failed to load requester signature image");
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null;
                })()}
              </div>
              
              {t.created_at && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Submitted {new Date(t.created_at).toLocaleString('en-PH', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Manila'
                    })}
                  </p>
                </div>
              )}
            </section>

            {/* Additional Requesters Section */}
            {additionalRequesters.length > 0 && (
              <section className="rounded-lg bg-blue-50/50 border border-blue-200 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Additional Requesters ({additionalRequesters.length})
                </p>
                <div className="space-y-3">
                  {loadingRequesters ? (
                    <div className="text-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      <p className="text-xs text-blue-600 mt-2">Loading requesters...</p>
                    </div>
                  ) : (
                    additionalRequesters.map((requester: any, index: number) => (
                      <div
                        key={requester.id || requester.user_id || index}
                        className="bg-white rounded-lg border border-blue-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {(requester.profile_picture || requester.avatar_url) ? (
                              <img 
                                src={requester.profile_picture || requester.avatar_url} 
                                alt={requester.name || "Requester"}
                                className="h-10 w-10 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.fallback-avatar-additional')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 fallback-avatar-additional';
                                    fallback.textContent = (requester.name || "U").charAt(0).toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {(requester.name || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 text-sm">{requester.name || 'Unknown'}</p>
                              {requester.department && (
                                <p className="text-xs text-slate-600 mt-1">{requester.department}</p>
                              )}
                              {requester.email && (
                                <p className="text-xs text-slate-500 mt-0.5">{requester.email}</p>
                              )}
                              {requester.confirmed_at && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Confirmed {new Date(requester.confirmed_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          {requester.signature && (
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs text-slate-500 font-medium">Signature</p>
                              <img
                                src={requester.signature}
                                alt={`${requester.name}'s signature`}
                                className="h-16 w-32 rounded border border-slate-300 bg-white object-contain p-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Service Preferences */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Service Preferences
              </p>
              
              {(t.preferred_driver_id || t.preferred_vehicle_id) ? (
                <div className="space-y-3">
                  {t.preferred_driver_id ? (
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <UserCog className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Preferred Driver</p>
                        <p className="text-sm font-medium text-slate-900">
                          {preferredDriverName || "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  
                  {t.preferred_vehicle_id ? (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Car className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Preferred Vehicle</p>
                        <p className="text-sm font-medium text-slate-900">
                          {preferredVehicleName || "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
                    <Car className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600">No driver or vehicle preferences</p>
                  <p className="text-xs text-slate-500 mt-1">Admin will assign resources</p>
                </div>
              )}
            </section>

            {/* Request Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <section className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4" />
                  Purpose
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4" />
                  Travel Dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.travel_start_date && t.travel_end_date
                    ? `${new Date(t.travel_start_date).toLocaleDateString()} – ${new Date(t.travel_end_date).toLocaleDateString()}`
                    : "—"}
                </p>
              </section>
              <section className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-1.5 mb-2">
                  <span className="text-base font-bold">₱</span>
                  Budget
                </p>
                <p className="text-lg font-bold text-[#7A0010]">
                  {peso(totalCost || t.total_budget)}
                </p>
              </section>
            </div>

            {/* Transportation Mode */}
            <section className="rounded-lg p-4 border-2 shadow-sm" style={{
              backgroundColor: (t as any).vehicle_mode === 'owned' ? '#f0fdf4' : (t as any).vehicle_mode === 'rent' ? '#fefce8' : '#eff6ff',
              borderColor: (t as any).vehicle_mode === 'owned' ? '#86efac' : (t as any).vehicle_mode === 'rent' ? '#fde047' : '#93c5fd'
            }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                  backgroundColor: (t as any).vehicle_mode === 'owned' ? '#d1fae5' : (t as any).vehicle_mode === 'rent' ? '#fef3c7' : '#dbeafe'
                }}>
                  <Car className="h-5 w-5" style={{
                    color: (t as any).vehicle_mode === 'owned' ? '#059669' : (t as any).vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                  }} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{
                    color: (t as any).vehicle_mode === 'owned' ? '#059669' : (t as any).vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                  }}>
                    Transportation Mode
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {(t as any).vehicle_mode === 'owned' && 'Personal Vehicle (Owned)'}
                    {(t as any).vehicle_mode === 'institutional' && 'University Vehicle'}
                    {(t as any).vehicle_mode === 'rent' && 'Rental Vehicle'}
                    {!(t as any).vehicle_mode && (t.vehicle_type || 'Not specified')}
                  </div>
                </div>
              </div>
            </section>

            {/* Destination */}
            <section className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Destination
                </p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 flex-1">
                  {t.destination || "No destination provided."}
                </p>
                {t.destination && (
                  <button
                    onClick={() => {
                      const encodedDest = encodeURIComponent(t.destination);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDest}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                    title="View on Google Maps"
                  >
                    <MapPin className="h-4 w-4" />
                    View Map
                  </button>
                )}
              </div>
            </section>

            {/* Pickup Details - Show if transportation_type is pickup */}
            {t?.transportation_type === 'pickup' && (t?.pickup_location || t?.pickup_time || t?.pickup_contact_number) && (
              <section className="rounded-lg bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="h-5 w-5 text-cyan-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                    Pickup Details
                  </p>
                </div>
                <div className="space-y-2">
                  {t?.pickup_location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-cyan-700 font-medium mb-0.5">Pickup Location</p>
                        <p className="text-sm font-semibold text-slate-900">{t.pickup_location}</p>
                      </div>
                    </div>
                  )}
                  {t?.pickup_time && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-cyan-700 font-medium mb-0.5">Pickup Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {t.pickup_time.includes(':') 
                            ? new Date(`2000-01-01T${t.pickup_time}`).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                              })
                            : t.pickup_time}
                        </p>
                      </div>
                    </div>
                  )}
                  {t?.pickup_contact_number && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-cyan-700 font-medium mb-0.5">Contact Number</p>
                        <p className="text-sm font-semibold text-slate-900">{t.pickup_contact_number}</p>
                      </div>
                    </div>
                  )}
                  {t?.pickup_special_instructions && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-cyan-700 font-medium mb-0.5">Special Instructions</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.pickup_special_instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Participants */}
            {t.participants && Array.isArray(t.participants) && t.participants.length > 0 && (
              <section className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                    Travel Participants ({t.participants.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {t.participants.map((participant: any, idx: number) => {
                    const participantName = typeof participant === 'string' 
                      ? participant 
                      : participant?.name || participant?.id || `Participant ${idx + 1}`;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-100">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-700">
                            {participantName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{participantName}</span>
                      </div>
                    );
                  })}
                </div>
                {t.head_included && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Department Head is included in travel
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Admin Assignment Details */}
            {(t?.assigned_driver_id || t?.assigned_vehicle_id || t?.admin_notes || t?.admin_comments) && (
              <section className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    Admin Assignment & Notes
                  </p>
                </div>
                <div className="space-y-3">
                  {t?.assigned_driver_id && (
                    <div className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <Users className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-indigo-700 font-medium mb-0.5">Assigned Driver</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {t?.assigned_driver_name || t?.assigned_driver?.name || 'Loading...'}
                        </p>
                        {t?.driver_contact_number && (
                          <p className="text-xs text-slate-600 mt-0.5">Contact: {t.driver_contact_number}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {t?.assigned_vehicle_id && (
                    <div className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <Car className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-indigo-700 font-medium mb-0.5">Assigned Vehicle</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {t?.assigned_vehicle_name || t?.assigned_vehicle?.name || t?.assigned_vehicle?.vehicle_name || (t?.assigned_vehicle?.model && t?.assigned_vehicle?.plate_number ? `${t.assigned_vehicle.model} (${t.assigned_vehicle.plate_number})` : null) || t?.assigned_vehicle?.plate_number || 'Not assigned'}
                        </p>
                        {t?.assigned_vehicle?.plate_number && (
                          <p className="text-xs text-slate-600 mt-0.5">Plate: {t.assigned_vehicle.plate_number}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {t?.admin_notes && (
                    <div className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <p className="text-xs text-indigo-700 font-medium mb-1">Admin Notes</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.admin_notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Attachments */}
            {t?.attachments && Array.isArray(t.attachments) && t.attachments.length > 0 && (
              <section className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Attached Documents ({t.attachments.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {t.attachments.map((attachment: any, idx: number) => (
                    <a
                      key={attachment.id || idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{attachment.name || `Document ${idx + 1}`}</p>
                        {attachment.size && (
                          <p className="text-xs text-slate-600">{(attachment.size / 1024).toFixed(2)} KB</p>
                        )}
                      </div>
                      <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Requester Signature - Same style as Previous Approvals */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-4">
                Requester's Signature
              </p>
              {(t.requester_signature) ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Requester Signed
                    </p>
                    {(t.requester_signed_at || t.created_at) && (
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(t.requester_signed_at || t.created_at).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Manila'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    By: <span className="font-medium text-slate-700">{t.requester_name || "Requester"}</span>
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <img
                      src={t.requester_signature}
                      alt="Requester signature"
                      className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white rounded-lg border border-slate-200 p-4">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>No signature provided by requester</span>
                </div>
              )}
            </section>

            {/* Previous Approvals - Show ALL signatures from all approvers BEFORE VP */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-4">
                Previous Approvals
              </p>
              <div className="space-y-3">
                {/* Check for BOTH direct head approval AND parent head approval */}
                {(() => {
                  const headApprover = t.head_approver;
                  const parentHeadApprover = t.parent_head_approver;
                  const hasHeadApproval = !!(t.head_approved_at || t.head_approved_by);
                  const hasParentHeadApproval = !!(t.parent_head_approved_at || t.parent_head_approved_by);
                  
                  const approverToUse = hasParentHeadApproval ? parentHeadApprover 
                    : hasHeadApproval ? headApprover 
                    : null;
                  const hasAnyHeadApproval = hasHeadApproval || hasParentHeadApproval;
                  
                  let signature: string | null = null;
                  if (t.parent_head_signature) {
                    signature = t.parent_head_signature;
                  } else if (t.head_signature) {
                    signature = t.head_signature;
                  }
                  
                  const approvalDate = t.parent_head_approved_at || t.head_approved_at;
                  const approverDept = approverToUse?.department?.name || approverToUse?.department_name || "";
                  
                  return hasAnyHeadApproval ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {hasParentHeadApproval ? "Parent Head Approved" : "Head Approved"}
                        </p>
                        <span className="text-xs text-slate-500 font-medium">
                          {approvalDate && new Date(approvalDate).toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Manila'
                          })}
                        </span>
                      </div>
                      {approverToUse && (
                        <p className="text-xs text-slate-600 mb-3">
                          By: <span className="font-medium text-slate-700">{approverToUse.name || (hasParentHeadApproval ? "Parent Head" : "Department Head")}</span>
                          {approverDept ? <span className="text-slate-500"> ({approverDept})</span> : ''}
                        </p>
                      )}
                      {signature && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <img
                            src={signature}
                            alt="Head signature"
                            className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                          />
                        </div>
                      )}
                      {(t.head_comments || t.parent_head_comments) && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Comments:</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{t.parent_head_comments || t.head_comments}</p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {t.admin_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-800">Admin Processed</p>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(t.admin_approved_at).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Manila'
                        })}
                      </span>
                    </div>
                    {t.admin_approved_by && (
                      <p className="text-xs text-slate-600 mb-3">
                        By: <span className="font-medium text-slate-700">{t.admin_approver?.name || "Transportation Management"}</span>
                      </p>
                    )}
                    {t.admin_signature && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <img
                          src={t.admin_signature}
                          alt="Transportation Management signature"
                          className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                        />
                      </div>
                    )}
                    {t.admin_comments && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Comments:</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{t.admin_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.comptroller_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-800">Comptroller Approved</p>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(t.comptroller_approved_at).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Manila'
                        })}
                      </span>
                    </div>
                    {t.comptroller_approved_by && (
                      <p className="text-xs text-slate-600 mb-3">
                        By: <span className="font-medium text-slate-700">{t.comptroller_approver?.name || "Comptroller"}</span>
                      </p>
                    )}
                    {t.comptroller_signature && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <img
                          src={t.comptroller_signature}
                          alt="Comptroller signature"
                          className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                        />
                      </div>
                    )}
                    {t.comptroller_comments && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Comments:</p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{t.comptroller_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.hr_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-800">HR Approved</p>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(t.hr_approved_at).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Manila'
                        })}
                      </span>
                    </div>
                    {t.hr_approved_by && (
                      <p className="text-xs text-slate-600 mb-3">
                        By: <span className="font-medium text-slate-700">{t.hr_approver?.name || "HR Officer"}</span>
                      </p>
                    )}
                    {t.hr_signature && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <img
                          src={t.hr_signature}
                          alt="HR signature"
                          className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                        />
                      </div>
                    )}
                    {t.hr_comments && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Comments:</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{t.hr_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Only show VP approval if ANOTHER VP (not current) has already approved */}
                {(() => {
                  // Check if current VP is viewing their own approval or another VP's
                  const currentVPId = vpProfile?.id;
                  const firstVPApproved = t.vp_approved_at && t.vp_approved_by;
                  const secondVPApproved = t.vp2_approved_at && t.vp2_approved_by;
                  
                  // Show first VP approval only if current VP is NOT the first VP
                  const showFirstVP = firstVPApproved && currentVPId !== t.vp_approved_by;
                  
                  return showFirstVP ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-800">VP Approved</p>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(t.vp_approved_at).toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Manila'
                          })}
                        </span>
                      </div>
                      {t.vp_approved_by && (
                        <p className="text-xs text-slate-600 mb-3">
                          By: <span className="font-medium text-slate-700">{t.vp_approver?.name || "Vice President"}</span>
                        </p>
                      )}
                      {t.vp_signature && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <img
                            src={t.vp_signature}
                            alt="VP signature"
                            className="h-20 w-full object-contain bg-slate-50 rounded p-2"
                          />
                        </div>
                      )}
                      {t.vp_comments && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Comments:</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{t.vp_comments}</p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {!t.head_approved_at && !t.parent_head_approved_at && !t.admin_approved_at && !t.comptroller_approved_at && !t.hr_approved_at && !(t.vp_approved_at && vpProfile?.id !== t.vp_approved_by) && (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No previous approvals yet
                  </div>
                )}
              </div>
            </section>

            {/* Budget Breakdown - Read Only with Comptroller Edit History */}
            <section className="rounded-lg bg-slate-50 border-2 border-[#7A0010] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-700">₱</span>
                  <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
                </div>
              </div>

              {/* Comptroller Comments */}
              {t.comptroller_comments && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Comptroller Comments:</p>
                  <p className="text-xs text-blue-800 whitespace-pre-wrap">{t.comptroller_comments}</p>
                </div>
              )}

              {editedExpenses.length > 0 ? (
                <>
                  <div className="space-y-2 mb-3">
                    {editedExpenses.map((expense: any, index: number) => {
                      const label = expense.item === "Other" && expense.description 
                        ? expense.description 
                        : expense.item || expense.description;
                      
                      // Find original expense for this item
                      const originalExpense = originalExpenses.find((orig: any) => 
                        (orig.item === expense.item || orig.description === expense.description) ||
                        (orig.item === expense.description || orig.description === expense.item) ||
                        (orig.item === label || orig.description === label)
                      );
                      const originalAmount = originalExpense?.amount;
                      // Check if comptroller edited the budget
                      const hasComptrollerEdit = t.comptroller_edited_budget && t.comptroller_edited_budget !== t.total_budget;
                      const wasEdited = hasComptrollerEdit && originalAmount !== undefined && originalAmount !== expense.amount;
                      
                      return expense.amount > 0 && (
                        <div key={index} className="py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{label}</span>
                            <div className="text-right">
                              {wasEdited && originalAmount !== undefined ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-slate-500 line-through">
                                    {peso(originalAmount)}
                                  </span>
                                  <span className="text-sm font-semibold text-[#7A0010]">
                                    {peso(expense.amount)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900">{peso(expense.amount)}</span>
                              )}
                            </div>
                          </div>
                          {expense.justification && (
                            <div className="mt-1.5 pl-2 border-l-2 border-blue-300">
                              <p className="text-xs text-blue-700 italic">
                                <span className="font-semibold">Justification:</span> {expense.justification}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-3 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                      <div className="text-right">
                        {t.comptroller_edited_budget && t.comptroller_edited_budget !== t.total_budget ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-slate-500 line-through">
                              {peso(t.total_budget || 0)}
                            </span>
                            <div className="text-lg font-bold text-[#7A0010]">
                              {peso(t.comptroller_edited_budget)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-[#7A0010]">
                            {peso(editedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">No budget specified</p>
                </div>
              )}
            </section>

            {/* Cost Justification */}
            {t.cost_justification && (
              <section className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  Cost Justification
                </h3>
                <div className="bg-white rounded-md border border-amber-200 p-3 text-sm text-gray-800 leading-relaxed shadow-sm">
                  {t.cost_justification}
                </div>
              </section>
            )}

            {/* VP Notes/Comments Input */}
            {!viewOnly && (
              <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
                <label className="mb-3 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Your Notes/Comments
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                  placeholder="Add your comments or reasons for approval/rejection..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - All requirements met. Request is complete and ready for next step.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - Budget and documentation verified. Ready for final approval.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - Request meets all criteria. Proceeding to President for final approval.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Ready for President
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Actions */}
        {(() => {
          const currentVPId = vpProfile?.id;
          const hasCurrentVPSigned = currentVPId && (
            (String(t.vp_approved_by) === String(currentVPId) && t.vp_signature) ||
            (String(t.vp2_approved_by) === String(currentVPId) && t.vp2_signature)
          );
          
          const hasAnySignature = !!(t.vp_signature || t.vp2_signature);
          const shouldHideButtons = hasCurrentVPSigned || (viewOnly && hasAnySignature);
          
          return !viewOnly && !shouldHideButtons ? (
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 shadow-lg">
              <button
                onClick={handleReject}
                disabled={submitting || isReturning}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <XCircle className="h-5 w-5" />
                {submitting ? "Rejecting..." : "Reject & Return to User"}
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={submitting || isReturning}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Sender
              </button>
              <button
                onClick={doApprove}
                disabled={submitting || isReturning}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="h-5 w-5" />
                {submitting ? "Approving..." : "Approve & Send"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          ) : null;
        })()}

        {viewOnly && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white">VP Review & Approval</h3>
                <p className="text-sm text-white/80">Sign and add notes to approve this request</p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
                className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* VP Profile */}
              <div className="flex items-center gap-3 pb-4 border-b-2 border-[#7A0010]/10">
                {vpProfile?.profile_picture ? (
                  <img 
                    src={vpProfile.profile_picture} 
                    alt={vpProfile?.name || "VP"}
                    className="h-14 w-14 rounded-full object-cover border-2 border-[#7A0010] shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(vpProfile?.name || "V").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900">
                    {vpProfile?.name || "Vice President"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {vpProfile?.position_title || "Vice President"}
                  </p>
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Your Signature <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                  <SignaturePad
                    height={160}
                    value={vpSignature || null}
                    onSave={(dataUrl) => {
                      setVpSignature(dataUrl);
                    }}
                    onClear={() => {
                      setVpSignature("");
                    }}
                    onUseSaved={(dataUrl) => {
                      setVpSignature(dataUrl);
                    }}
                    showUseSavedButton={true}
                    hideSaveButton
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Notes/Comments <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-slate-500 ml-2">(Minimum 10 characters)</span>
                </label>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#7A0010]/20 rounded-xl focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                  placeholder="Add your comments or reasons for approval..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  {notes.trim().length}/10 characters minimum
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - All requirements met. Request is complete and ready for next step.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - Budget and documentation verified. Ready for final approval.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Approved - Request meets all criteria. Proceeding to President for final approval.")}
                    disabled={viewOnly}
                    className="text-xs px-3 py-1.5 rounded-md border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approved - Ready for President
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-gray-50 relative">
              {submitting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium text-slate-700">Processing approval...</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={submitting || !vpSignature || notes.trim().length < 10}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Confirm Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to Sender Modal */}
      <ReturnToSenderModal
        open={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleReturnToSender}
        isLoading={isReturning}
        requestNumber={request.request_number || request.id}
      />

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => setShowApproverSelection(false)}
          onSelect={(approverId, approverRole, returnReason) => {
            const id = Array.isArray(approverId) ? approverId[0] : (typeof approverId === 'string' ? approverId : null);
            const role = Array.isArray(approverRole) ? approverRole[0] : (typeof approverRole === 'string' ? approverRole : 'president');
            proceedWithApproval(id, role, returnReason);
          }}
          title="Select Next Approver"
          description="Choose who should review this request next, or return it to the requester for revision."
          options={approverOptions}
          currentRole="vp"
          allowReturnToRequester={false}
          requesterId={request.requester_id}
          requesterName={request.requester?.name || "Requester"}
          loading={loadingApprovers}
          allowAllUsers={true}
          fetchAllUsers={async () => {
            try {
              const allUsersRes = await fetch("/api/users/all");
              if (!allUsersRes.ok) {
                console.warn("[VPRequestModal] All users API not OK:", allUsersRes.status);
                return [];
              }
              const contentType = allUsersRes.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                console.warn("[VPRequestModal] All users API returned non-JSON response");
                return [];
              }
              const allUsersData = await allUsersRes.json();
              if (allUsersData.ok && allUsersData.data) {
                return allUsersData.data.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  profile_picture: u.profile_picture,
                  phone: u.phone,
                  position: u.position,
                  department: u.department,
                  role: u.role,
                  roleLabel: u.roleLabel
                }));
              }
              return [];
            } catch (err) {
              console.error("[VPRequestModal] Error fetching all users:", err);
              return [];
            }
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
        title="Success"
      />
    </div>
    </>
  );
}
