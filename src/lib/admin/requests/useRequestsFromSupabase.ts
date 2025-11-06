// src/lib/admin/requests/useRequestsFromSupabase.ts
"use client";

import useSWR from "swr";
import { useMemo } from "react";

type SupabaseRequestRecord = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Request details
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  request_number: string;
  title: string;
  
  // Relations
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  head_approver?: {
    id: string;
    name: string;
    email: string;
  };
  
  // Assignments
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  
  // Expenses
  expense_breakdown?: any;
  
  // Signatures
  requester_signature?: string;
  head_signature?: string;
  head_approved_by?: string;
  head_approved_at?: string;
  
  admin_signature?: string;
  admin_approved_by?: string;
  admin_approved_at?: string;
  admin_notes?: string;
  
  comptroller_signature?: string;
  comptroller_approved_by?: string;
  comptroller_approved_at?: string;
  
  hr_signature?: string;
  hr_approved_by?: string;
  hr_approved_at?: string;
  
  executive_signature?: string;
  executive_approved_by?: string;
  executive_approved_at?: string;
  
  // Additional details
  seminar_details?: any;
  school_service_details?: any;
  
  // Legacy support
  payload?: any;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export function useRequestsFromSupabase() {
  const { data, error, isLoading } = useSWR<SupabaseRequestRecord[]>(
    "/api/requests/list",
    fetcher
  );

  // Use useMemo to prevent creating new empty array on every render (causes infinite loop)
  const requests = useMemo(() => data ?? [], [data]);

  return {
    loading: isLoading,
    error,
    requests,
  };
}
