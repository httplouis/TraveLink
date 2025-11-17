// src/lib/feedback/notifications.ts
/**
 * Feedback System - Force notification after trip completion
 * Triggers forced feedback notification when trip is marked as completed
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * Check if trip is completed and trigger feedback notification
 * Should be called when:
 * 1. Trip status changes to "completed"
 * 2. Actual return date is set and is in the past
 * 3. Request is approved and travel_end_date has passed
 */
export async function triggerFeedbackNotification(
  requestId: string,
  tripId?: string
): Promise<void> {
  const supabase = await createSupabaseServerClient(true);
  
  // Get request details
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("id, requester_id, requester_name, travel_end_date, status, request_number")
    .eq("id", requestId)
    .single();
  
  if (requestError || !request) {
    console.error("[Feedback Notification] Request not found:", requestError);
    return;
  }
  
  // Only trigger for approved requests
  if (request.status !== "approved") {
    return;
  }
  
  // Check if travel has ended (travel_end_date is in the past)
  const travelEndDate = new Date(request.travel_end_date);
  const now = new Date();
  const oneDayAfter = new Date(travelEndDate);
  oneDayAfter.setDate(oneDayAfter.getDate() + 1);
  
  // Only trigger if travel ended at least 1 day ago (Nov 22, 9 PM → trigger on Nov 23)
  if (now < oneDayAfter) {
    return; // Too early, wait until next day
  }
  
  // Check if feedback already exists for this request
  const { data: existingFeedback } = await supabase
    .from("feedback")
    .select("id")
    .eq("trip_id", requestId)
    .eq("user_id", request.requester_id)
    .maybeSingle();
  
  if (existingFeedback) {
    // Feedback already submitted, don't send notification
    return;
  }
  
  // Check if notification already sent (to avoid duplicates)
  const { data: existingNotification } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", request.requester_id)
    .eq("notification_type", "feedback_required")
    .eq("related_id", requestId)
    .maybeSingle();
  
  if (existingNotification) {
    // Notification already sent
    return;
  }
  
  // Create forced feedback notification
  try {
    await createNotification({
      user_id: request.requester_id,
      notification_type: "feedback_required",
      title: "Feedback Required - Trip Completed",
      message: `Your trip for request ${request.request_number || ''} has been completed. Please provide feedback about your experience.`,
      related_type: "request",
      related_id: requestId,
      action_url: `/user/feedback?request_id=${requestId}`,
      action_label: "Provide Feedback",
      priority: "urgent", // High priority to force user to see it
    });
    
    console.log(`[Feedback Notification] ✅ Triggered for request ${requestId}`);
  } catch (error) {
    console.error("[Feedback Notification] Failed to create notification:", error);
  }
}

/**
 * Check all completed trips and trigger feedback notifications
 * Should be called periodically (e.g., daily cron job)
 */
export async function checkAndTriggerFeedbackNotifications(): Promise<void> {
  const supabase = await createSupabaseServerClient(true);
  const now = getPhilippineTimestamp();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  // Find all approved requests where travel_end_date was at least 1 day ago
  const { data: completedRequests, error } = await supabase
    .from("requests")
    .select("id, requester_id, travel_end_date, status, request_number")
    .eq("status", "approved")
    .lte("travel_end_date", oneDayAgo.toISOString())
    .order("travel_end_date", { ascending: false });
  
  if (error) {
    console.error("[Feedback Notification] Error fetching completed requests:", error);
    return;
  }
  
  if (!completedRequests || completedRequests.length === 0) {
    return;
  }
  
  console.log(`[Feedback Notification] Found ${completedRequests.length} completed trips to check`);
  
  // Trigger notification for each completed trip
  for (const request of completedRequests) {
    await triggerFeedbackNotification(request.id);
  }
}

