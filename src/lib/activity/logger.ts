// src/lib/activity/logger.ts
/**
 * Activity Logger Service
 * Records user activities for audit and history tracking
 */

import { createClient } from "@supabase/supabase-js";

export interface ActivityLogEntry {
  user_id: string;
  action: string;
  action_type: "approve" | "reject" | "return" | "submit" | "edit" | "view" | "assign" | "resubmit" | "cancel" | "sign";
  target_type: "request" | "user" | "vehicle" | "driver" | "department";
  target_id: string;
  target_name?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityFilters {
  action_type?: string;
  target_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log an activity to the request_history table
 */
export async function logActivity(entry: ActivityLogEntry): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[logActivity] Missing Supabase configuration");
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Log to request_history if target is a request
    if (entry.target_type === "request") {
      const { error } = await supabase.from("request_history").insert({
        request_id: entry.target_id,
        action: entry.action,
        actor_id: entry.user_id,
        actor_role: entry.metadata?.actor_role || "user",
        comments: entry.metadata?.comments || null,
        metadata: {
          ...entry.metadata,
          action_type: entry.action_type,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
        },
      });

      if (error) {
        console.error("[logActivity] Error logging to request_history:", error);
        return false;
      }
    }

    // Also log to audit_logs for comprehensive tracking
    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.target_type,
      resource_id: entry.target_id,
      details: {
        action_type: entry.action_type,
        target_name: entry.target_name,
        ...entry.metadata,
      },
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
    });

    if (auditError) {
      console.warn("[logActivity] Warning logging to audit_logs:", auditError);
      // Don't fail if audit_logs fails - request_history is primary
    }

    return true;
  } catch (err) {
    console.error("[logActivity] Unexpected error:", err);
    return false;
  }
}

/**
 * Get activity history for a user
 * Shows activities the user performed AND activities on their requests
 */
export async function getActivityHistory(
  userId: string,
  filters?: ActivityFilters
): Promise<{ data: any[]; total: number }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[getActivityHistory] Missing Supabase configuration:", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return { data: [], total: 0 };
    }
    
    console.log("[getActivityHistory] Supabase config OK, creating client...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    console.log("[getActivityHistory] Fetching activity for userId:", userId);

    // First, get all request IDs owned by this user
    const { data: userRequests, error: reqError } = await supabase
      .from("requests")
      .select("id")
      .eq("requester_id", userId);
    
    if (reqError) {
      console.error("[getActivityHistory] Error fetching user requests:", reqError);
    }
    
    const userRequestIds = (userRequests || []).map((r: any) => r.id);
    console.log("[getActivityHistory] User has", userRequestIds.length, "requests");

    // Query request_history for:
    // 1. Activities the user performed (actor_id = userId)
    // 2. Activities on the user's requests (request_id in userRequestIds)
    
    // Build the query - start with base select
    let query = supabase
      .from("request_history")
      .select(`
        id,
        request_id,
        action,
        actor_id,
        actor_role,
        previous_status,
        new_status,
        comments,
        metadata,
        created_at
      `, { count: "exact" });

    // Apply filter: actor_id = userId OR request_id in userRequestIds
    if (userRequestIds.length > 0) {
      // Use OR filter with proper syntax
      query = query.or(`actor_id.eq.${userId},request_id.in.(${userRequestIds.join(",")})`);
      console.log("[getActivityHistory] Using OR filter with", userRequestIds.length, "request IDs");
    } else {
      // Just filter by actor_id
      query = query.eq("actor_id", userId);
      console.log("[getActivityHistory] Using simple actor_id filter");
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    // Apply filters
    if (filters?.action_type) {
      query = query.eq("action", filters.action_type);
    }
    
    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date);
    }
    
    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    console.log("[getActivityHistory] Query result:", { 
      dataLength: data?.length || 0, 
      count, 
      error: error?.message 
    });

    if (error) {
      console.error("[getActivityHistory] Error fetching activity:", error);
      return { data: [], total: 0 };
    }

    // Fetch related data separately to avoid join issues
    const requestIds = [...new Set((data || []).map((item: any) => item.request_id).filter(Boolean))];
    const actorIds = [...new Set((data || []).map((item: any) => item.actor_id).filter(Boolean))];

    // Fetch requests
    let requestsMap: Record<string, any> = {};
    if (requestIds.length > 0) {
      const { data: requests } = await supabase
        .from("requests")
        .select("id, request_number, purpose, requester_id")
        .in("id", requestIds);
      
      if (requests) {
        requestsMap = Object.fromEntries(requests.map((r: any) => [r.id, r]));
      }
    }

    // Fetch actors
    let actorsMap: Record<string, any> = {};
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", actorIds);
      
      if (actors) {
        actorsMap = Object.fromEntries(actors.map((a: any) => [a.id, a]));
      }
    }

    // Transform data to expected format
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      request: requestsMap[item.request_id] || null,
      actor: actorsMap[item.actor_id] || null,
      is_own_action: item.actor_id === userId,
    }));

    return { data: transformedData, total: count || 0 };
  } catch (err) {
    console.error("[getActivityHistory] Unexpected error:", err);
    return { data: [], total: 0 };
  }
}
