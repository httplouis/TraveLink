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
      console.log("[Feedback Lock] No authenticated user");
      return { locked: false };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      console.log("[Feedback Lock] No profile found for user:", user.id);
      return { locked: false };
    }

    console.log("[Feedback Lock] Checking for user profile.id:", profile.id);

    // Find completed trips that need feedback
    // Trip is completed if:
    // 1. Request is approved
    // 2. travel_end_date has passed (at least 1 day ago)
    // 3. No feedback exists for this request
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find approved requests where travel ended at least 1 day ago
    const { data: completedRequests, error: requestsError } = await supabase
      .from("requests")
      .select("id, request_number, travel_end_date, status")
      .eq("requester_id", profile.id)
      .eq("status", "approved")
      .lte("travel_end_date", oneDayAgo.toISOString())
      .order("travel_end_date", { ascending: false })
      .limit(1);

    if (requestsError) {
      console.error("[Feedback Lock] Error fetching requests:", requestsError);
      return { locked: false };
    }

    if (!completedRequests || completedRequests.length === 0) {
      console.log("[Feedback Lock] No completed trips found for user");
      return { locked: false };
    }

    const latestRequest = completedRequests[0];
    console.log("[Feedback Lock] Found completed trip:", {
      id: latestRequest.id,
      request_number: latestRequest.request_number,
      travel_end_date: latestRequest.travel_end_date
    });

    // Check if feedback already exists for this completed trip
    // First, let's see ALL feedback for debugging
    const { data: allFeedback, error: allFeedbackError } = await supabase
      .from("feedback")
      .select("id, trip_id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    console.log("[Feedback Lock] Recent feedback records:", allFeedback);
    if (allFeedbackError) {
      console.error("[Feedback Lock] Error fetching all feedback:", allFeedbackError);
    }

    // Now check for this specific trip (use limit(1) instead of maybeSingle to handle multiple records)
    // We check if ANY feedback exists for this trip - the requester is responsible for providing it
    const { data: existingFeedback, error: feedbackError } = await supabase
      .from("feedback")
      .select("id, trip_id, user_id, created_at")
      .eq("trip_id", latestRequest.id)
      .limit(1);

    console.log("[Feedback Lock] Checking for trip_id:", latestRequest.id);
    console.log("[Feedback Lock] Found feedback for this trip:", existingFeedback);

    if (feedbackError) {
      console.error("[Feedback Lock] Error checking feedback:", feedbackError.message || feedbackError);
      return { locked: false };
    }

    if (existingFeedback && existingFeedback.length > 0) {
      // Feedback already provided, no lock needed
      console.log("[Feedback Lock] Feedback already exists:", existingFeedback[0]);
      return { locked: false };
    }

    console.log("[Feedback Lock] No feedback found for trip, locking UI");

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

