// src/lib/feedback/lock.ts
/**
 * Feedback System - UI Lock
 * Locks the UI until feedback is provided for completed trips
 */

import { createSupabaseClient } from "@/lib/supabase/client";

export interface FeedbackLockStatus {
  locked: boolean;
  requestId?: string;
  requestNumber?: string;
  tripEndDate?: string;
  message?: string;
}

/**
 * Check if user needs to provide feedback (UI should be locked)
 * Returns lock status if feedback is required
 */
export async function checkFeedbackLock(): Promise<FeedbackLockStatus> {
  const supabase = createSupabaseClient();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { locked: false };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return { locked: false };
    }

    // Find completed trips that need feedback
    // Trip is completed if:
    // 1. Request is approved
    // 2. travel_end_date has passed (at least 1 day ago)
    // 3. No feedback exists for this request
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find approved requests where travel ended at least 1 day ago
    const { data: completedRequests } = await supabase
      .from("requests")
      .select("id, request_number, travel_end_date, status")
      .eq("requester_id", profile.id)
      .eq("status", "approved")
      .lte("travel_end_date", oneDayAgo.toISOString())
      .order("travel_end_date", { ascending: false })
      .limit(1);

    if (!completedRequests || completedRequests.length === 0) {
      return { locked: false };
    }

    const latestRequest = completedRequests[0];

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("trip_id", latestRequest.id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingFeedback) {
      // Feedback already provided, no lock needed
      return { locked: false };
    }

    // User needs to provide feedback - lock UI
    return {
      locked: true,
      requestId: latestRequest.id,
      requestNumber: latestRequest.request_number || undefined,
      tripEndDate: latestRequest.travel_end_date,
      message: `Please provide feedback for your completed trip (Request ${latestRequest.request_number || ''}). This is required before you can continue using the system.`
    };
  } catch (error) {
    console.error("[Feedback Lock] Error checking lock status:", error);
    // On error, don't lock UI (fail open)
    return { locked: false };
  }
}

/**
 * Check if feedback notification exists (to show forced modal)
 */
export async function hasFeedbackNotification(): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) return false;

    // Check for urgent feedback notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", profile.id)
      .eq("notification_type", "feedback_required")
      .eq("priority", "urgent")
      .eq("is_read", false)
      .limit(1);

    return (notifications?.length || 0) > 0;
  } catch (error) {
    console.error("[Feedback Lock] Error checking notifications:", error);
    return false;
  }
}

