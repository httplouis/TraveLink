// src/lib/admin/requests/useRequestsFromSupabase.ts
"use client";

import useSWR from "swr";
import { useMemo, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

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
  
  // Vehicle mode
  vehicle_mode?: 'owned' | 'institutional' | 'rent';
  
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
    return r.json().then((data) => {
      // Handle both formats: direct array or { ok: true, data: [...] }
      if (data.ok && Array.isArray(data.data)) {
        console.log("[useRequestsFromSupabase] Received data from admin inbox:", data.data.length, "requests");
        return data.data;
      }
      if (Array.isArray(data)) {
        console.log("[useRequestsFromSupabase] Received direct array:", data.length, "requests");
        return data;
      }
      console.error("[useRequestsFromSupabase] Unexpected response format:", data);
      return [];
    });
  });

export function useRequestsFromSupabase() {
  const { data, error, isLoading, mutate } = useSWR<SupabaseRequestRecord[]>(
    "/api/admin/inbox",
    fetcher,
    {
      refreshInterval: 30000, // OPTIMIZED: Reduced frequency from 5s to 30s to minimize egress
      revalidateOnFocus: true, // Re-fetch when window gains focus
      revalidateOnReconnect: true, // Refresh when internet reconnects
      dedupingInterval: 1000, // Prevent duplicate requests within 1 second
      errorRetryCount: 2, // Only retry twice on error
      errorRetryInterval: 3000, // Wait 3 seconds between retries
      revalidateIfStale: true, // Always revalidate if data is stale
      revalidateOnMount: true, // Revalidate when component mounts
    }
  );

  // Use useMemo to prevent creating new empty array on every render (causes infinite loop)
  const requests = useMemo(() => data ?? [], [data]);

  // Real-time subscription to requests table
  useEffect(() => {
    const supabase = createSupabaseClient();
    
    console.log("[useRequestsFromSupabase] Setting up real-time subscription...");
    
    // Debounce mutate calls to prevent rapid successive refetches
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    // Subscribe to changes on requests table
    const channel = supabase
      .channel("admin-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "requests",
        },
        (payload) => {
          console.log("[useRequestsFromSupabase] 🔄 Real-time change detected:", payload.eventType, (payload.new as any)?.id || 'unknown');
          
          // Debounce: only trigger refetch after 200ms of no changes for faster updates
          if (mutateTimeout) clearTimeout(mutateTimeout);
          mutateTimeout = setTimeout(() => {
            console.log("[useRequestsFromSupabase] ⚡ Triggering refetch after debounce");
            mutate();
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log("[useRequestsFromSupabase] Subscription status:", status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("[useRequestsFromSupabase] Cleaning up subscription...");
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  return {
    loading: isLoading,
    error,
    requests,
  };
}
