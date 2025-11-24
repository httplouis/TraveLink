// src/components/comptroller/ComptrollerReviewModal.tsx
"use client";

import React from "react";
import { X, Edit2, Check, XCircle, FileText, Calendar, User, MapPin, Building2, Users, Car, UserCog, CheckCircle2, Clock } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/Toast";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Request = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  total_budget: number;
  comptroller_edited_budget?: number;
  expense_breakdown?: Array<{
    item: string;
    description?: string;
    amount: number;
  }>;
  travel_start_date: string;
  travel_end_date: string;
  created_at: string;
  status: string;
  requester?: {
    name: string;
    email: string;
  };
  department?: {
    code: string;
    name: string;
  };
};

type Props = {
  request: any;
  onClose: () => void;
};

export default function ComptrollerReviewModal({ request, onClose }: Props) {
  const toast = useToast();
  const [fullRequest, setFullRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingBudget, setEditingBudget] = React.useState(false);
  const [editedExpenses, setEditedExpenses] = React.useState<Array<{ item: string; amount: number; description?: string; justification?: string }>>([]);
  const [comptrollerNotes, setComptrollerNotes] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);
  const [showApproverSelection, setShowApproverSelection] = React.useState(false);
  const [approverOptions, setApproverOptions] = React.useState<any[]>([]);
  const [nextApproverId, setNextApproverId] = React.useState<string | null>(null);
  const [nextApproverRole, setNextApproverRole] = React.useState<string | null>(null);
  const [comptrollerProfile, setComptrollerProfile] = React.useState<any>(null);
  const [defaultApproverId, setDefaultApproverId] = React.useState<string | undefined>(undefined);
  const [defaultApproverName, setDefaultApproverName] = React.useState<string | undefined>(undefined);
  const [suggestionReason, setSuggestionReason] = React.useState<string | undefined>(undefined);
  const [preferredDriverName, setPreferredDriverName] = React.useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = React.useState<string>("");
  const [totalCost, setTotalCost] = React.useState(0);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [additionalRequesters, setAdditionalRequesters] = React.useState<any[]>([]);
  const [loadingRequesters, setLoadingRequesters] = React.useState(false);
  const [mainRequesterSignature, setMainRequesterSignature] = React.useState<string | null>(null);

  const loadAdditionalRequesters = React.useCallback(async () => {
    try {
      setLoadingRequesters(true);
      const t = fullRequest || request;
      
      // Check for additional_requesters, requester_tracking, requester_invitations, or head_endorsements
      const requesters = t?.additional_requesters || t?.requester_tracking || t?.requester_invitations || [];
      
      if (Array.isArray(requesters) && requesters.length > 0) {
        // If requesters have IDs, fetch full details
        const requesterPromises = requesters.map(async (req: any) => {
          // For requester_invitations, use user_id if available, otherwise use the invitation data as-is
          if (req.user_id) {
            try {
              const res = await fetch(`/api/users/${req.user_id}`);
              if (res.ok) {
                const json = await res.json();
                if (json.ok && json.data) {
                  return {
                    ...req,
                    ...json.data,
                    name: req.name || json.data.name,
                    email: req.email || json.data.email,
                    department: req.department || json.data.department?.name || json.data.department?.code,
                    signature: req.signature || json.data.signature,
                    confirmed_at: req.confirmed_at || req.created_at,
                    profile_picture: req.profile_picture || json.data.profile_picture || json.data.avatar_url
                  };
                }
              }
            } catch (err) {
              console.error("[ComptrollerReviewModal] Error loading requester:", err);
            }
          }
          // Return the requester data as-is if no user_id or if fetch failed
          return req;
        });
        
        const loadedRequesters = await Promise.all(requesterPromises);
        
        // Find main requester's signature from requester_invitations
        // Check multiple ways to identify the main requester
        const mainRequester = loadedRequesters.find(r => {
          if (!r) return false;
          return (r.user_id === t?.requester_id) || 
                 (r.user_id === request?.requester_id) ||
                 (r.id === t?.requester_id) ||
                 (r.id === request?.requester_id) ||
                 (r.email === t?.requester?.email) ||
                 (r.email === request?.requester?.email) ||
                 (r.email?.toLowerCase() === t?.requester_name?.toLowerCase()?.split(' ').map((n: string) => n.charAt(0)).join('') + '@' || '');
        });
        
        if (mainRequester?.signature) {
          console.log("[ComptrollerReviewModal] ✅ Found main requester signature from requester_invitations:", {
            name: mainRequester.name,
            email: mainRequester.email,
            signatureLength: mainRequester.signature?.length || 0
          });
          setMainRequesterSignature(mainRequester.signature);
        } else {
          console.log("[ComptrollerReviewModal] ⚠️ Main requester signature not found in requester_invitations:", {
            requester_id: t?.requester_id || request?.requester_id,
            requester_name: t?.requester_name || request?.requester_name,
            loadedRequestersCount: loadedRequesters.length,
            mainRequesterFound: !!mainRequester,
            mainRequesterHasSignature: !!mainRequester?.signature
          });
        }
        
        // Filter out the main requester - check both id and user_id
        setAdditionalRequesters(loadedRequesters.filter(r => {
          if (!r) return false;
          // Exclude if it's the main requester (check both invitation id and user_id)
          const isMainRequester = (r.user_id === t?.requester_id) || (r.id === t?.requester_id);
          return !isMainRequester;
        }));
      } else {
        setAdditionalRequesters([]);
      }
    } catch (err) {
      console.error("[ComptrollerReviewModal] Error loading additional requesters:", err);
      setAdditionalRequesters([]);
    } finally {
      setLoadingRequesters(false);
    }
  }, [fullRequest, request]);

  React.useEffect(() => {
    loadFullRequest();
    loadComptrollerProfile();
  }, [request.id]);

  React.useEffect(() => {
    if (fullRequest || request) {
      loadAdditionalRequesters();
    }
  }, [fullRequest, request, loadAdditionalRequesters]);

  // Ensure expense breakdown is initialized even if API fails - RUN IMMEDIATELY
  React.useEffect(() => {
    // If editedExpenses is empty but we have a budget, initialize it
    // Don't wait for loading to finish - initialize immediately if we have request prop data
    if (editedExpenses.length === 0) {
      const req = fullRequest || request;
      const budgetToUse = req?.comptroller_edited_budget || req?.total_budget || 0;
      
      if (budgetToUse > 0) {
        console.log("[ComptrollerReviewModal] ⚠️ editedExpenses is empty but budget exists, initializing immediately...", budgetToUse);
        // Parse expense_breakdown if it exists
        let expenseBreakdown = req?.expense_breakdown;
        if (typeof expenseBreakdown === 'string') {
          try {
            expenseBreakdown = JSON.parse(expenseBreakdown);
          } catch (e) {
            expenseBreakdown = null;
          }
        }
        
        if (expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
          const validExpenses = expenseBreakdown
            .filter((exp: any) => exp && (exp.item || exp.description || exp.label))
            .map((exp: any) => ({
              item: exp.item || exp.label || exp.description || "Travel Expenses",
              amount: exp.amount || 0,
              description: exp.description || exp.item || null
            }));
          if (validExpenses.length > 0) {
            console.log("[ComptrollerReviewModal] ✅ Setting expenses from expense_breakdown in useEffect:", validExpenses);
            setEditedExpenses(validExpenses);
            const total = validExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
            setTotalCost(total || budgetToUse);
            return;
          }
        }
        
        // Create default breakdown - ALWAYS create if budget exists
        const expenses = [
          { item: "Food", amount: Math.round(budgetToUse * 0.25), description: "Meals" },
          { item: "Transportation", amount: Math.round(budgetToUse * 0.35), description: "Travel costs" },
          { item: "Accommodation", amount: Math.round(budgetToUse * 0.25), description: "Lodging" },
          { item: "Other", amount: budgetToUse - Math.round(budgetToUse * 0.25) - Math.round(budgetToUse * 0.35) - Math.round(budgetToUse * 0.25), description: "Miscellaneous" }
        ];
        console.log("[ComptrollerReviewModal] ✅ Setting default expenses in useEffect:", expenses);
        setEditedExpenses(expenses);
        setTotalCost(budgetToUse);
      }
    }
  }, [fullRequest?.id, request?.id, editedExpenses.length]); // Use IDs instead of objects to prevent infinite loops

  const loadComptrollerProfile = async () => {
    try {
      const meRes = await fetch("/api/profile");
      if (!meRes.ok) {
        console.warn("[ComptrollerReviewModal] Profile API not OK:", meRes.status);
        return;
      }
      const contentType = meRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[ComptrollerReviewModal] Profile API returned non-JSON response");
        return;
      }
      const meData = await meRes.json();
      if (meData) {
        setComptrollerProfile(meData);
      }
    } catch (err) {
      console.error("[ComptrollerReviewModal] Failed to load profile:", err);
    }
  };

  const loadFullRequest = async () => {
    try {
      setLoading(true);
      console.log("[ComptrollerReviewModal] Loading request:", request.id);
      
      const res = await fetch(`/api/requests/${request.id}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        // Handle 401 (Unauthorized) gracefully - session might have expired
        if (res.status === 401) {
          console.warn("[ComptrollerReviewModal] Authentication required. Using request prop data.");
          setFullRequest(request);
          setLoading(false);
          return;
        }
        console.error("[ComptrollerReviewModal] API response not OK:", res.status, res.statusText);
        throw new Error(`Failed to load request: ${res.status} ${res.statusText}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[ComptrollerReviewModal] API returned non-JSON response. Content-Type:", contentType);
        const text = await res.text();
        console.error("[ComptrollerReviewModal] Response text (first 200 chars):", text.substring(0, 200));
        throw new Error("API returned non-JSON response");
      }
      
      const json = await res.json();
      
      if (!json.ok || !json.data) {
        console.error("[ComptrollerReviewModal] API returned error:", json.error || "Unknown error");
        throw new Error(json.error || "Failed to load request data");
      }
      
      setFullRequest(json.data);
      const req = json.data;
      
      console.log("[ComptrollerReviewModal] Request loaded:", {
        id: req.id,
        request_number: req.request_number,
        total_budget: req.total_budget,
        comptroller_edited_budget: req.comptroller_edited_budget,
        has_expense_breakdown: !!req.expense_breakdown,
        expense_breakdown_type: typeof req.expense_breakdown,
        expense_breakdown_value: req.expense_breakdown,
        has_requester_signature: !!req.requester_signature,
        requester_signature_length: req.requester_signature?.length || 0,
        requester_id: req.requester_id,
        requester_name: req.requester_name,
      });
      
      // Parse expense_breakdown if it's a string (JSONB from database)
      let expenseBreakdown = req.expense_breakdown;
      if (typeof expenseBreakdown === 'string') {
        try {
          expenseBreakdown = JSON.parse(expenseBreakdown);
          console.log("[ComptrollerReviewModal] Parsed expense_breakdown from string");
        } catch (e) {
          console.error("[ComptrollerReviewModal] Failed to parse expense_breakdown:", e);
          expenseBreakdown = null;
        }
      }
      
      // Initialize edited expenses from original - similar to VP modal
      // Use comptroller_edited_budget if available, otherwise use total_budget
      const budgetToUse = req.comptroller_edited_budget || req.total_budget || 0;
      
      if (expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
        console.log("[ComptrollerReviewModal] Found expense_breakdown:", expenseBreakdown);
        // Include ALL expenses from breakdown - show them all with their labels
        const validExpenses = expenseBreakdown
          .filter((exp: any) => exp && (exp.item || exp.description || exp.label))
          .map((exp: any) => ({
            item: exp.item || exp.label || exp.description || "Travel Expenses",
            amount: exp.amount || 0,
            description: exp.description || exp.item || null,
            justification: exp.justification || exp.budget_justification || null
          }));
        
        if (validExpenses.length > 0) {
          console.log("[ComptrollerReviewModal] Setting expenses from expense_breakdown:", validExpenses);
          setEditedExpenses(validExpenses);
          const total = validExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          setTotalCost(total || budgetToUse);
          console.log("[ComptrollerReviewModal] Set expenses from expense_breakdown:", validExpenses.length, "items, total:", total);
        } else {
          // If expense_breakdown exists but no valid items, create breakdown from total_budget
          if (budgetToUse > 0) {
            const defaultExpenses = [
              { item: "Food", amount: Math.round(budgetToUse * 0.3), description: "Meals" },
              { item: "Transportation", amount: Math.round(budgetToUse * 0.4), description: "Travel costs" },
              { item: "Other", amount: budgetToUse - Math.round(budgetToUse * 0.3) - Math.round(budgetToUse * 0.4), description: "Miscellaneous" }
            ];
            setEditedExpenses(defaultExpenses);
            setTotalCost(budgetToUse);
            console.log("[ComptrollerReviewModal] Created default expense breakdown from total_budget:", defaultExpenses);
          } else {
            setEditedExpenses([]);
            setTotalCost(0);
            console.log("[ComptrollerReviewModal] No expenses to display");
          }
        }
      } else {
        console.log("[ComptrollerReviewModal] No expense_breakdown found, reconstructing from total_budget:", budgetToUse);
        // ALWAYS create expense breakdown items if total_budget > 0
        // Show common expense categories even if breakdown doesn't exist
        if (budgetToUse > 0) {
          const expenses: Array<{ item: string; amount: number; description?: string }> = [];
          
          // Always show Food (common expense)
          const foodAmount = Math.round(budgetToUse * 0.25);
          expenses.push({ item: "Food", amount: foodAmount, description: "Meals" });
          
          // Check if there are any hints in the request data
          if (req.needs_rental || req.vehicle_mode === 'rent') {
            expenses.push({ item: "Transportation", amount: Math.round(budgetToUse * 0.35), description: "Vehicle rental" });
          }
          
          if (req.travel_start_date && req.travel_end_date) {
            const startDate = new Date(req.travel_start_date);
            const endDate = new Date(req.travel_end_date);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (days > 1) {
              expenses.push({ item: "Accommodation", amount: Math.round(budgetToUse * 0.25), description: "Lodging" });
            }
          }
          
          // Calculate remaining amount
          const allocated = expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const remaining = budgetToUse - allocated;
          
          // Add remaining amount as "Other Expenses" if positive
          if (remaining > 0) {
            expenses.push({ item: "Other", amount: remaining, description: "Miscellaneous expenses" });
          } else if (expenses.length === 0) {
            // If no hints, split budget into common categories
            expenses.push({ item: "Food", amount: Math.round(budgetToUse * 0.3), description: "Meals" });
            expenses.push({ item: "Transportation", amount: Math.round(budgetToUse * 0.4), description: "Travel costs" });
            expenses.push({ item: "Other", amount: budgetToUse - Math.round(budgetToUse * 0.3) - Math.round(budgetToUse * 0.4), description: "Miscellaneous" });
          }
          
          console.log("[ComptrollerReviewModal] Created expense breakdown from total_budget:", expenses);
          setEditedExpenses(expenses);
          setTotalCost(budgetToUse);
          console.log("[ComptrollerReviewModal] ✅ Set editedExpenses:", expenses.length, "items");
        } else {
          setEditedExpenses([]);
          setTotalCost(0);
          console.log("[ComptrollerReviewModal] No budget specified");
        }
      }
      
      // Debug: Log final state
      console.log("[ComptrollerReviewModal] Final state after initialization:", {
        editedExpensesCount: editedExpenses.length,
        totalCost,
        budgetToUse,
        hasExpenseBreakdown: !!expenseBreakdown
      });

      // Load preferred driver
      if (req.preferred_driver_id) {
        try {
          const driverRes = await fetch(`/api/users/${req.preferred_driver_id}`);
          if (!driverRes.ok) {
            console.warn("[ComptrollerReviewModal] Driver API not OK:", driverRes.status);
            return;
          }
          const contentType = driverRes.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("[ComptrollerReviewModal] Driver API returned non-JSON response");
            return;
          }
          const driverData = await driverRes.json();
          if (driverData.ok && driverData.data) {
            setPreferredDriverName(driverData.data.name || "Unknown Driver");
          }
        } catch (err) {
          console.error("[ComptrollerReviewModal] Failed to load driver:", err);
        }
      }

      // Load preferred vehicle - check if already in response first
      if (req.preferred_vehicle_id) {
        // Check if vehicle data is already in the response
        if (req.preferred_vehicle?.name || req.preferred_vehicle?.vehicle_name || req.preferred_vehicle?.plate_number) {
          const vehicleName = req.preferred_vehicle.name || req.preferred_vehicle.vehicle_name || req.preferred_vehicle.plate_number;
          setPreferredVehicleName(vehicleName);
        } else if (req.preferred_vehicle_name) {
          setPreferredVehicleName(req.preferred_vehicle_name);
        } else {
          // Fetch from API if not in response
          try {
            const vehicleRes = await fetch(`/api/vehicles/${req.preferred_vehicle_id}`);
            if (!vehicleRes.ok) {
              console.warn("[ComptrollerReviewModal] Vehicle API not OK:", vehicleRes.status);
              setPreferredVehicleName("Not specified");
              return;
            }
            const contentType = vehicleRes.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn("[ComptrollerReviewModal] Vehicle API returned non-JSON response");
              setPreferredVehicleName("Not specified");
              return;
            }
            const vehicleData = await vehicleRes.json();
            if (vehicleData.ok && vehicleData.data) {
              setPreferredVehicleName(vehicleData.data.name || vehicleData.data.vehicle_name || vehicleData.data.plate_number || "Unknown Vehicle");
            } else {
              setPreferredVehicleName("Not specified");
            }
          } catch (err) {
            console.error("[ComptrollerReviewModal] Failed to load vehicle:", err);
            setPreferredVehicleName("Not specified");
          }
        }
      }
    } catch (err: any) {
      // Only log non-401 errors to avoid noise
      if (err?.message && !err.message.includes('401')) {
        console.error("[ComptrollerReviewModal] Failed to load request:", err);
      }
      // Don't show toast error - just use request prop data
      // Still set fullRequest to request prop so modal can still display
      setFullRequest(request);
      
      // Even if API fails, ALWAYS initialize expense breakdown from request prop
      const req = request;
      const budgetToUse = req?.comptroller_edited_budget || req?.total_budget || 0;
      
      console.log("[ComptrollerReviewModal] Error handler - initializing expenses from request prop, budget:", budgetToUse);
      
      // Parse expense_breakdown if it exists
      let expenseBreakdown = req?.expense_breakdown;
      if (typeof expenseBreakdown === 'string') {
        try {
          expenseBreakdown = JSON.parse(expenseBreakdown);
        } catch (e) {
          expenseBreakdown = null;
        }
      }
      
      // Initialize expenses from breakdown or create default - ALWAYS create if budget > 0
      if (expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
        const validExpenses = expenseBreakdown
          .filter((exp: any) => exp && (exp.item || exp.description || exp.label))
          .map((exp: any) => ({
            item: exp.item || exp.label || exp.description || "Travel Expenses",
            amount: exp.amount || 0,
            description: exp.description || exp.item || null,
            justification: exp.justification || exp.budget_justification || null
          }));
        if (validExpenses.length > 0) {
          console.log("[ComptrollerReviewModal] ✅ Setting expenses from expense_breakdown:", validExpenses);
          setEditedExpenses(validExpenses);
          const total = validExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          setTotalCost(total || budgetToUse);
        } else if (budgetToUse > 0) {
          // Create default breakdown
          const defaultExpenses = [
            { item: "Food", amount: Math.round(budgetToUse * 0.3), description: "Meals" },
            { item: "Transportation", amount: Math.round(budgetToUse * 0.4), description: "Travel costs" },
            { item: "Other", amount: budgetToUse - Math.round(budgetToUse * 0.3) - Math.round(budgetToUse * 0.4), description: "Miscellaneous" }
          ];
          console.log("[ComptrollerReviewModal] ✅ Setting default expenses:", defaultExpenses);
          setEditedExpenses(defaultExpenses);
          setTotalCost(budgetToUse);
        }
      } else if (budgetToUse > 0) {
        // ALWAYS create default breakdown from total_budget if no breakdown exists
        const expenses = [
          { item: "Food", amount: Math.round(budgetToUse * 0.25), description: "Meals" },
          { item: "Transportation", amount: Math.round(budgetToUse * 0.35), description: "Travel costs" },
          { item: "Accommodation", amount: Math.round(budgetToUse * 0.25), description: "Lodging" },
          { item: "Other", amount: budgetToUse - Math.round(budgetToUse * 0.25) - Math.round(budgetToUse * 0.35) - Math.round(budgetToUse * 0.25), description: "Miscellaneous" }
        ];
        console.log("[ComptrollerReviewModal] ✅ Setting default expenses from budget:", expenses);
        setEditedExpenses(expenses);
        setTotalCost(budgetToUse);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseEdit = (index: number, newAmount: string) => {
    // Remove leading zeros and handle empty input
    let cleanedValue = newAmount.trim();
    
    // If empty, set to 0 (but don't show leading zeros)
    if (cleanedValue === '' || cleanedValue === '0') {
      cleanedValue = '';
    } else {
      // Remove leading zeros (e.g., "0700" -> "700")
      cleanedValue = cleanedValue.replace(/^0+/, '') || '0';
      
      // If it becomes empty after removing zeros, keep it empty
      if (cleanedValue === '') {
        cleanedValue = '';
      }
    }
    
    // Parse to number, but preserve empty string for display
    const amount = cleanedValue === '' ? 0 : parseFloat(cleanedValue) || 0;
    
    setEditedExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount };
      return updated;
    });
  };

  const handleJustificationEdit = (index: number, justification: string) => {
    setEditedExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], justification };
      return updated;
    });
  };

  const calculatedTotal = React.useMemo(() => {
    return editedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [editedExpenses]);

  // Update totalCost when calculatedTotal changes (but not in useMemo to avoid infinite loop)
  React.useEffect(() => {
    if (calculatedTotal !== totalCost) {
      setTotalCost(calculatedTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedTotal]);

  const doApprove = async () => {
    console.log("[Comptroller] ========== APPROVE BUTTON CLICKED ==========");
    // Open approval modal instead of directly proceeding
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    console.log("[Comptroller] ========== APPROVAL SUBMITTED ==========");
    console.log("[Comptroller] Has signature:", !!signature);
    
    if (!signature) {
      console.log("[Comptroller] No signature - showing error toast");
      toast.error("Signature Required", "Please provide your signature");
      return;
    }
    
    // Close approval modal
    setShowApprovalModal(false);

    // Fetch available approvers (HR) - continue with approval process
    try {
      const approversRes = await fetch("/api/approvers/list?role=hr");
      if (!approversRes.ok) {
        console.warn("[Comptroller] Approvers API not OK:", approversRes.status);
        return;
      }
      const contentType = approversRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[Comptroller] Approvers API returned non-JSON response");
        return;
      }
      const approversData = await approversRes.json();
      
      console.log("[Comptroller] Approvers response:", approversData);
      
      if (approversData.ok) {
        const options = (approversData.data || []).map((a: any) => ({
          ...a,
          roleLabel: a.roleLabel || "Human Resources"
        }));
        
        // Smart suggestion logic
        try {
          const { suggestNextApprover, findSuggestedApprover } = await import('@/lib/workflow/suggest-next-approver');
          const t = fullRequest || request;
          const suggestion = suggestNextApprover({
            status: t.status,
            requester_is_head: t.requester_is_head || false,
            requester_role: t.requester?.role || t.requester_role,
            has_budget: (t.total_budget || 0) > 0,
            head_included: t.head_included || false,
            parent_head_approved_at: t.parent_head_approved_at,
            parent_head_approver: t.parent_head_approver,
            requester_signature: t.requester_signature,
            head_approved_at: t.head_approved_at,
            admin_approved_at: t.admin_approved_at,
            comptroller_approved_at: t.comptroller_approved_at,
            hr_approved_at: t.hr_approved_at,
            vp_approved_at: t.vp_approved_at,
            vp2_approved_at: t.vp2_approved_at,
            both_vps_approved: t.both_vps_approved || false
          });
          
          let suggestionReasonText = '';
          
          if (suggestion) {
            const suggested = findSuggestedApprover(suggestion, options);
            if (suggested) {
              setDefaultApproverId(suggested.id);
              setDefaultApproverName(suggested.name);
              suggestionReasonText = suggestion.reason;
              console.log("[ComptrollerReviewModal] ✅ Smart suggestion:", suggestion.roleLabel, "-", suggestion.reason);
            } else {
              console.log("[ComptrollerReviewModal] ⚠️ Suggestion not found in options:", suggestion.roleLabel);
            }
          }
          
          setSuggestionReason(suggestionReasonText);
        } catch (err) {
          console.error("[ComptrollerReviewModal] Error in smart suggestion:", err);
        }
        
        console.log("[Comptroller] Approver options count:", options.length);
        setApproverOptions(options);
        setShowApproverSelection(true);
        return;
      } else {
        console.error("[Comptroller] Approvers API error:", approversData.error);
        // Still show modal even if API fails, so user can return to requester
        setApproverOptions([]);
        setShowApproverSelection(true);
        return;
      }
    } catch (err) {
      console.error("[Comptroller] Error fetching approvers:", err);
      // Still show modal even if fetch fails, so user can return to requester
      setApproverOptions([]);
      setShowApproverSelection(true);
      return;
    }
  };

  const proceedWithApproval = async (selectedApproverId?: string | null, selectedApproverRole?: string | null) => {
    console.log("[Comptroller] Starting approval process...");
    setSubmitting(true);
    try {
      const res = await fetch("/api/comptroller/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature,
          notes: comptrollerNotes,
          editedBudget: calculatedTotal !== request.total_budget ? calculatedTotal : null,
          nextApproverId: selectedApproverId || nextApproverId,
          nextApproverRole: selectedApproverRole || nextApproverRole || "hr",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[ComptrollerReviewModal] Approve API error:", res.status, errorText.substring(0, 200));
        throw new Error(`Failed to approve: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("[ComptrollerReviewModal] Approve API returned non-JSON. Response:", errorText.substring(0, 200));
        throw new Error("API returned non-JSON response");
      }

      const json = await res.json();
      
      console.log("[Comptroller Approve] API Response:", json);
      
      if (json.ok) {
        console.log("[Comptroller Approve] Showing success toast...");
        toast.success("Request Approved", "✅ Request approved and sent to HR for review");
        // Delay to show toast before closing (increased to 1500ms to ensure visibility)
        console.log("[Comptroller Approve] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Comptroller Approve] Closing modal now");
          onClose();
        }, 1500);
      } else {
        console.log("[Comptroller Approve] Showing error toast:", json.error);
        toast.error("Approval Failed", json.error || "Failed to approve request");
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Error", "Failed to approve request. Please try again.");
    } finally {
      setSubmitting(false);
      setShowApproverSelection(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectConfirm) {
      setShowRejectConfirm(true);
      return;
    }

    if (!comptrollerNotes.trim()) {
      toast.error("Reason Required", "Please provide a reason for rejection");
      setShowRejectConfirm(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comptroller/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
          notes: comptrollerNotes,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[ComptrollerReviewModal] Reject API error:", res.status, errorText.substring(0, 200));
        throw new Error(`Failed to reject: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("[ComptrollerReviewModal] Reject API returned non-JSON. Response:", errorText.substring(0, 200));
        throw new Error("API returned non-JSON response");
      }

      const json = await res.json();
      
      if (json.ok) {
        console.log("[Comptroller Reject] Showing info toast...");
        toast.info("Request Rejected", "Request rejected and sent back to user");
        // Delay to show toast before closing
        console.log("[Comptroller Reject] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Comptroller Reject] Closing modal now");
          onClose();
        }, 1500);
      } else {
        toast.error("Rejection Failed", json.error || "Failed to reject request");
      }
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Error", "Failed to reject request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const t = fullRequest || request;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
      <div className="relative w-full max-w-7xl max-h-[90vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Comptroller Review
            </h2>
            {t?.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              t?.status === 'pending_comptroller' ? 'bg-amber-100 text-amber-700' :
              t?.status === 'approved' ? 'bg-green-100 text-green-700' :
              t?.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {t?.status === 'pending_comptroller' ? 'Pending Review' :
               t?.status === 'approved' ? 'Approved' :
               t?.status === 'rejected' ? 'Rejected' :
               t?.status || 'Pending'}
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
                {(t?.requester?.profile_picture || t?.requester?.avatar_url) ? (
                  <img 
                    src={t.requester.profile_picture || t.requester.avatar_url} 
                    alt={t?.requester_name || "Requester"}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                        fallback.textContent = (t?.requester_name || "U").charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(t?.requester_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900 mb-1">
                    <NameWithProfile
                      name={t?.requester_name || t?.requester?.name || t?.requester?.email || "Unknown Requester"}
                      profile={{
                        id: t?.requester?.id || '',
                        name: t?.requester_name || t?.requester?.name || '',
                        email: t?.requester?.email,
                        department: t?.department?.name || t?.department?.code,
                        position: t?.requester?.position_title,
                        profile_picture: t?.requester?.profile_picture,
                      }}
                    />
                  </p>
                  <p className="text-sm text-slate-600">
                    {t?.department?.name || t?.department?.code || "No department indicated"}
                  </p>
                  {t?.requester?.position_title && (
                    <p className="text-xs text-slate-500 mt-0.5">{t.requester.position_title}</p>
                  )}
                  {t?.requester?.role && (
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
                  // First, check requester_invitations array directly from fullRequest
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
                          console.error("[ComptrollerReviewModal] Failed to load requester signature image");
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null;
                })()}
              </div>
              
              {t?.created_at && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Submitted {new Date(t.created_at).toLocaleString('en-US', { 
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
              
              {(t?.preferred_driver_id || t?.preferred_vehicle_id) ? (
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
                          {preferredVehicleName || t?.preferred_vehicle_name || t?.preferred_vehicle?.name || t?.preferred_vehicle?.vehicle_name || t?.preferred_vehicle?.plate_number || "Not specified"}
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
                  {t?.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4" />
                  Travel Dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t?.travel_start_date && t?.travel_end_date
                    ? `${new Date(t.travel_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – ${new Date(t.travel_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : "—"}
                </p>
              </section>
              <section className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-1.5 mb-2">
                  <span className="text-base font-bold">₱</span>
                  Budget
                </p>
                <p className="text-lg font-bold text-[#7A0010]">
                  {peso(totalCost || t?.total_budget)}
                </p>
              </section>
            </div>

            {/* Transportation Mode */}
            {t?.vehicle_mode && (
              <section className="rounded-lg p-4 border-2 shadow-sm" style={{
                backgroundColor: t.vehicle_mode === 'owned' ? '#f0fdf4' : t.vehicle_mode === 'rent' ? '#fefce8' : '#eff6ff',
                borderColor: t.vehicle_mode === 'owned' ? '#86efac' : t.vehicle_mode === 'rent' ? '#fde047' : '#93c5fd'
              }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                    backgroundColor: t.vehicle_mode === 'owned' ? '#d1fae5' : t.vehicle_mode === 'rent' ? '#fef3c7' : '#dbeafe'
                  }}>
                    <Car className="h-5 w-5" style={{
                      color: t.vehicle_mode === 'owned' ? '#059669' : t.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{
                      color: t.vehicle_mode === 'owned' ? '#059669' : t.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }}>
                      Transportation Mode
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {t.vehicle_mode === 'owned' && 'Personal Vehicle (Owned)'}
                      {t.vehicle_mode === 'institutional' && 'University Vehicle'}
                      {t.vehicle_mode === 'rent' && 'Rental Vehicle'}
                      {!t.vehicle_mode && (t.vehicle_type || 'Not specified')}
                    </div>
                  </div>
                </div>
              </section>
            )}

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
                  {t?.destination || "No destination provided."}
                </p>
                {t?.destination && (
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
                      <Calendar className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
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
            {t?.participants && Array.isArray(t.participants) && t.participants.length > 0 && (
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

            {/* Cost Justification */}
            {t?.cost_justification && (
              <section className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Cost Justification
                  </p>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg px-3 py-2 border border-amber-100">
                  {t.cost_justification}
                </p>
              </section>
            )}

            {/* Previous Approvals */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase text-slate-700 mb-3">
                Previous Approvals
              </p>
              <div className="space-y-3">
                {/* Check for BOTH direct head approval AND parent head approval (SVP, etc.) */}
                {/* Also check VP approval if VP is also a head (dual role) */}
                {(() => {
                  const headApprover = t?.head_approver;
                  const parentHeadApprover = t?.parent_head_approver;
                  const vpApprover = t?.vp_approver;
                  const hasHeadApproval = !!(t?.head_approved_at || t?.head_approved_by);
                  const hasParentHeadApproval = !!(t?.parent_head_approved_at || t?.parent_head_approved_by);
                  const hasVpApproval = !!(t?.vp_approved_at || t?.vp_approved_by);
                  const vpIsHead = vpApprover?.is_head === true;
                  
                  // Debug logging
                  console.log("[ComptrollerReviewModal] Head Approval Check:", {
                    hasHeadApproval,
                    hasParentHeadApproval,
                    hasVpApproval,
                    vpIsHead,
                    headApprover: headApprover ? { id: headApprover.id, name: headApprover.name } : null,
                    parentHeadApprover: parentHeadApprover ? { id: parentHeadApprover.id, name: parentHeadApprover.name } : null,
                    vpApprover: vpApprover ? { id: vpApprover.id, name: vpApprover.name, is_head: vpApprover.is_head } : null,
                    parent_head_signature: t?.parent_head_signature ? "EXISTS" : "NULL",
                    head_signature: t?.head_signature ? "EXISTS" : "NULL",
                    vp_signature: t?.vp_signature ? "EXISTS" : "NULL",
                    fullRequest: !!fullRequest,
                    request: !!request
                  });
                  
                  // Priority: parent head > direct head > VP (if VP is head)
                  const approverToUse = hasParentHeadApproval ? parentHeadApprover 
                    : hasHeadApproval ? headApprover 
                    : (hasVpApproval && vpIsHead) ? vpApprover 
                    : null;
                  const hasAnyHeadApproval = hasHeadApproval || hasParentHeadApproval || (hasVpApproval && vpIsHead);
                  
                  // Get signature - priority: parent_head_signature > head_signature > vp_signature (if VP is head)
                  let signature: string | null = null;
                  if (t?.parent_head_signature) {
                    signature = t.parent_head_signature;
                  } else if (t?.head_signature) {
                    signature = t.head_signature;
                  } else if (hasVpApproval && vpIsHead && t?.vp_signature) {
                    signature = t.vp_signature;
                  }
                  
                  // Get approval date
                  const approvalDate = t?.parent_head_approved_at || t?.head_approved_at || (hasVpApproval && vpIsHead ? t?.vp_approved_at : null);
                  const approverDept = approverToUse?.department?.name || approverToUse?.department_name || "";
                  
                  return hasAnyHeadApproval ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">
                          {hasParentHeadApproval ? "Parent Head Approved (SVP)" : hasHeadApproval ? "Head Approved" : "VP Approved (as Head)"}
                        </p>
                        <span className="text-xs text-green-600 font-medium">
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
                        <p className="text-xs text-slate-600">
                          By: {approverToUse.name || (hasParentHeadApproval ? "Parent Head" : hasHeadApproval ? "Department Head" : "VP")}
                          {approverDept ? ` (${approverDept})` : ''}
                        </p>
                      )}
                      {signature && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <img
                            src={signature}
                            alt="Head signature"
                            className="h-16 w-full object-contain"
                          />
                        </div>
                      )}
                      {(t?.head_comments || t?.parent_head_comments) && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Comments:</p>
                          <p className="text-xs text-slate-700">{t?.parent_head_comments || t?.head_comments}</p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {t?.admin_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Admin Processed</p>
                      <span className="text-xs text-green-600 font-medium">
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
                      <p className="text-xs text-slate-600">
                        By: {t.admin_approver?.name || "Administrator"}
                      </p>
                    )}
                    {t.admin_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.admin_signature}
                          alt="Admin signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.admin_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.admin_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {!t?.head_approved_at && !t?.parent_head_approved_at && !t?.vp_approved_at && !t?.admin_approved_at && (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No previous approvals yet
                  </div>
                )}
              </div>
            </section>

            {/* Budget Breakdown - MAIN FOCUS (with editing capability) */}
            <section className="rounded-lg bg-slate-50 border-2 border-[#7A0010] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-700">₱</span>
                  <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
                </div>
                {!editingBudget && (fullRequest?.total_budget || fullRequest?.comptroller_edited_budget || editedExpenses.length > 0) && (
                  <button
                    onClick={() => setEditingBudget(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7A0010] text-white hover:bg-[#5e000d] rounded-lg transition-colors text-xs font-semibold shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Budget
                  </button>
                )}
              </div>

              {(() => {
                const hasExpenses = editedExpenses.length > 0;
                const hasBudget = fullRequest?.total_budget || fullRequest?.comptroller_edited_budget || request?.total_budget;
                console.log("[ComptrollerReviewModal] Budget display check:", {
                  editedExpensesLength: editedExpenses.length,
                  hasExpenses,
                  hasBudget,
                  fullRequestBudget: fullRequest?.total_budget,
                  requestBudget: request?.total_budget,
                  expenses: editedExpenses
                });
                return hasExpenses || hasBudget;
              })() ? (
                <>
                  <div className="space-y-3 mb-3">
                    {editedExpenses.length > 0 ? (
                      editedExpenses
                        .map((expense, index) => {
                          // Use item name as label, or description if available
                          const label = expense.item || expense.description || "Unknown";
                          const displayLabel = expense.item === "Other" && (expense as any).description 
                            ? (expense as any).description 
                            : label;
                          
                          // Get original amount from fullRequest
                          const originalExpense = (fullRequest || request)?.expense_breakdown?.[index];
                          const originalAmount = originalExpense?.amount || 0;
                          const currentAmount = expense.amount || 0;
                          const hasChanged = originalAmount !== currentAmount && originalAmount > 0;
                          
                          // ALWAYS show items - don't filter out 0 amounts, show them all
                          return (
                            <div key={index} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600 font-medium">{displayLabel}</span>
                                {editingBudget ? (
                                  <div className="flex items-center gap-2">
                                    {hasChanged && (
                                      <span className="text-xs text-slate-400 line-through">
                                        {peso(originalAmount)}
                                      </span>
                                    )}
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={expense.amount === 0 ? '' : expense.amount || ''}
                                      onChange={(e) => {
                                        // Only allow numbers and decimal point
                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                        // Prevent multiple decimal points
                                        const parts = value.split('.');
                                        const cleanedValue = parts.length > 2 
                                          ? parts[0] + '.' + parts.slice(1).join('')
                                          : value;
                                        handleExpenseEdit(index, cleanedValue);
                                      }}
                                      onBlur={(e) => {
                                        // On blur, ensure we have a valid number (default to 0 if empty)
                                        const value = e.target.value.trim();
                                        if (value === '' || value === '0') {
                                          setEditedExpenses(prev => {
                                            const updated = [...prev];
                                            updated[index] = { ...updated[index], amount: 0 };
                                            return updated;
                                          });
                                        }
                                      }}
                                      className="w-32 px-3 py-1.5 border-2 border-[#7A0010]/20 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] text-sm"
                                      placeholder="0"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-900">{peso(expense.amount || 0)}</span>
                                )}
                              </div>
                              {editingBudget && (
                                <div className="mt-2">
                                  <textarea
                                    value={expense.justification || ""}
                                    onChange={(e) => handleJustificationEdit(index, e.target.value)}
                                    placeholder={`Justification for ${displayLabel} (optional)`}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] text-sm resize-none"
                                    rows={2}
                                  />
                                </div>
                              )}
                              {!editingBudget && expense.justification && (
                                <div className="mt-1.5">
                                  <p className="text-xs text-slate-500 italic">"{expense.justification}"</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      // Fallback: If no expenses but has budget, show as single item (shouldn't happen after our fix)
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600 font-medium">Total Budget</span>
                        {editingBudget ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={calculatedTotal === 0 ? '' : (calculatedTotal || (fullRequest?.comptroller_edited_budget || fullRequest?.total_budget || 0))}
                            onChange={(e) => {
                              // Only allow numbers and decimal point
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = value.split('.');
                              const cleanedValue = parts.length > 2 
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : value;
                              // Remove leading zeros
                              const finalValue = cleanedValue.replace(/^0+/, '') || '0';
                              const amount = finalValue === '' || finalValue === '0' ? 0 : parseFloat(finalValue) || 0;
                              setEditedExpenses([{ item: "Travel Expenses", amount }]);
                              setTotalCost(amount);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === '' || value === '0') {
                                setEditedExpenses([{ item: "Travel Expenses", amount: 0 }]);
                                setTotalCost(0);
                              }
                            }}
                            className="w-32 px-3 py-1.5 border-2 border-[#7A0010]/20 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-900">
                            {peso(fullRequest?.comptroller_edited_budget || fullRequest?.total_budget || 0)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {(calculatedTotal > 0 || (fullRequest?.total_budget || fullRequest?.comptroller_edited_budget)) && (
                    <div className="pt-3 border-t-2 border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                        <div className="text-right">
                          {calculatedTotal > 0 && calculatedTotal !== (fullRequest?.total_budget || 0) && (
                            <div className="text-sm text-slate-500 line-through mb-1">
                              {peso(fullRequest?.total_budget || 0)}
                            </div>
                          )}
                          <div className={`text-lg font-bold ${calculatedTotal > 0 && calculatedTotal !== (fullRequest?.total_budget || 0) ? 'text-[#7A0010]' : 'text-slate-900'}`}>
                            {peso(calculatedTotal || fullRequest?.comptroller_edited_budget || fullRequest?.total_budget || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingBudget && (
                    <div className="mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            // Save budget edits without approving
                            try {
                              setSubmitting(true);
                              const res = await fetch("/api/comptroller/action", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  requestId: request.id,
                                  action: "edit_budget",
                                  editedBudget: calculatedTotal,
                                  expense_breakdown: editedExpenses.map(exp => ({
                                    item: exp.item,
                                    amount: exp.amount,
                                    description: exp.description,
                                    justification: exp.justification || null
                                  })), // Send updated expense breakdown with justifications
                                  notes: comptrollerNotes || "Budget edited by comptroller",
                                }),
                              });

                            if (!res.ok) {
                              const errorText = await res.text();
                              console.error("[ComptrollerReviewModal] Edit budget API error:", res.status, errorText.substring(0, 200));
                              throw new Error(`Failed to edit budget: ${res.status}`);
                            }

                            const contentType = res.headers.get("content-type");
                            if (!contentType || !contentType.includes("application/json")) {
                              const errorText = await res.text();
                              console.error("[ComptrollerReviewModal] Edit budget API returned non-JSON. Response:", errorText.substring(0, 200));
                              throw new Error("API returned non-JSON response");
                            }

                            const json = await res.json();
                            
                            if (json.ok) {
                              toast.success("Budget Updated", "Budget updated successfully");
                              setEditingBudget(false);
                              // Reload request to show updated budget
                              await loadFullRequest();
                            } else {
                              toast.error("Update Failed", json.error || "Failed to update budget");
                            }
                          } catch (err) {
                            console.error("Save budget error:", err);
                            toast.error("Save Failed", "Failed to save budget. Please try again.");
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4" />
                        {submitting ? "Saving..." : "Save Budget Changes"}
                      </button>
                      <button
                        onClick={() => {
                          // Cancel editing - revert to original
                          const originalExpenses = (fullRequest || request).expense_breakdown;
                          if (originalExpenses && Array.isArray(originalExpenses)) {
                            setEditedExpenses(
                              originalExpenses.map((exp: any) => ({
                                item: exp.item || exp.description || "Travel Expenses",
                                amount: exp.amount || 0,
                                description: exp.description || null,
                                justification: exp.justification || exp.budget_justification || null
                              }))
                            );
                          }
                          setEditingBudget(false);
                        }}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">No budget specified</p>
                </div>
              )}
            </section>

            {/* Cost Justification */}
            {t?.cost_justification && (
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

            {/* Comptroller Notes/Comments Input */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <label className="mb-3 block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Your Notes/Comments
              </label>
              <textarea
                value={comptrollerNotes}
                onChange={(e) => setComptrollerNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                placeholder="Add your comments or reasons for approval/rejection..."
              />
            </section>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 shadow-lg">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <XCircle className="h-5 w-5" />
            {submitting ? "Rejecting..." : "Reject & Return to User"}
          </button>
          <button
            onClick={doApprove}
            disabled={submitting}
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
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white">Comptroller Review & Approval</h3>
                <p className="text-sm text-white/80">Sign and add notes to approve this request</p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Comptroller Profile */}
              <div className="flex items-center gap-3 pb-4 border-b-2 border-[#7A0010]/10">
                {(comptrollerProfile?.profile_picture || comptrollerProfile?.avatar_url) ? (
                  <img 
                    src={comptrollerProfile.profile_picture || comptrollerProfile.avatar_url} 
                    alt={comptrollerProfile?.name || "Comptroller"}
                    className="h-14 w-14 rounded-full object-cover border-2 border-[#7A0010] shadow-lg flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar-comptroller-modal')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 fallback-avatar-comptroller-modal';
                        fallback.textContent = (comptrollerProfile?.name || 'C').charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                    {(comptrollerProfile?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7A0010]/70">
                    Comptroller Review
                  </p>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    {comptrollerProfile?.name || comptrollerProfile?.email || (comptrollerProfile ? "Comptroller" : "Loading...")}
                  </div>
                  {comptrollerProfile?.department && (
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {comptrollerProfile.department.name || comptrollerProfile.department.code}
                    </p>
                  )}
                  {comptrollerProfile?.position_title && (
                    <p className="text-xs text-slate-500 mt-0.5">{comptrollerProfile.position_title}</p>
                  )}
                </div>
              </div>

              {/* Comptroller Signature */}
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  Your Signature <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                  <SignaturePad
                    height={160}
                    value={signature || null}
                    onSave={(dataUrl) => {
                      setSignature(dataUrl);
                    }}
                    onClear={() => {
                      setSignature(null);
                    }}
                    onUseSaved={(dataUrl) => {
                      setSignature(dataUrl);
                    }}
                    showUseSavedButton={true}
                    hideSaveButton
                  />
                </div>
              </div>

              {/* Comptroller Notes */}
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  Comptroller Notes/Comments
                </label>
                
                {/* Quick Fill Buttons */}
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setComptrollerNotes("Budget verified. Proceed to HR.")}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Budget Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setComptrollerNotes("Budget verified and approved. All expenses are justified.")}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Budget Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setComptrollerNotes("Budget requires revision. Please review and resubmit with corrected amounts.")}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Needs Revision
                  </button>
                </div>
                
                <textarea
                  value={comptrollerNotes}
                  onChange={(e) => setComptrollerNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#7A0010]/20 rounded-xl focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                  placeholder="Add your comments or reasons for approval/rejection..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={submitting || !signature}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-5 w-5" />
                {submitting ? "Processing..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => setShowApproverSelection(false)}
          onSelect={(approverId, approverRole) => {
            const id = Array.isArray(approverId) ? approverId[0] : (typeof approverId === 'string' ? approverId : null);
            const role = Array.isArray(approverRole) ? approverRole[0] : (typeof approverRole === 'string' ? approverRole : null);
            proceedWithApproval(id || undefined, role || undefined);
          }}
          title="Select Next Approver"
          description="Choose where to send this request after approval."
          options={approverOptions}
          currentRole="comptroller"
          requesterId={fullRequest?.requester_id}
          requesterName={fullRequest?.requester_name || request.requester?.name}
          returnReasons={[
            { value: 'budget_change', label: 'Budget Change Required' },
            { value: 'other', label: 'Other' }
          ]}
          defaultApproverId={defaultApproverId}
          defaultApproverName={defaultApproverName}
          suggestionReason={suggestionReason}
          allowAllUsers={true}
          fetchAllUsers={async () => {
            try {
              const allUsersRes = await fetch("/api/users/all");
              if (!allUsersRes.ok) {
                console.warn("[ComptrollerReviewModal] All users API not OK:", allUsersRes.status);
                return [];
              }
              const contentType = allUsersRes.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                console.warn("[ComptrollerReviewModal] All users API returned non-JSON response");
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
              console.error("[ComptrollerReviewModal] Error fetching all users:", err);
              return [];
            }
          }}
        />
      )}
    </div>
  );
}
