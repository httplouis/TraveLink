// src/lib/notifications/helpers.ts
/**
 * Helper functions for creating notifications consistently
 */

import { createClient } from "@supabase/supabase-js";

export interface NotificationData {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  action_label?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: NotificationData): Promise<boolean> {
  try {
    console.log("[createNotification] Creating notification:", {
      user_id: data.user_id,
      notification_type: data.notification_type,
      title: data.title,
      message: data.message.substring(0, 50) + "...",
      related_id: data.related_id
    });
    
    // Use createClient directly with service_role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[createNotification] ❌ Missing Supabase configuration");
      return false;
    }
    
    // Service role client for database operations (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    const { data: insertedData, error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.user_id,
        notification_type: data.notification_type,
        title: data.title,
        message: data.message,
        related_type: data.related_type || null,
        related_id: data.related_id || null,
        action_url: data.action_url || null,
        action_label: data.action_label || null,
        priority: data.priority || "normal",
      })
      .select()
      .single();

    if (error) {
      console.error("[createNotification] ❌ Error creating notification:", error);
      console.error("[createNotification] Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("[createNotification] ✅ Notification created successfully:", {
      id: insertedData?.id,
      user_id: insertedData?.user_id,
      notification_type: insertedData?.notification_type
    });
    return true;
  } catch (err) {
    console.error("[createNotification] ❌ Unexpected error:", err);
    return false;
  }
}

/**
 * Create notifications for request approval
 */
export async function notifyRequestApproved(
  requestId: string,
  requestNumber: string,
  requesterId: string,
  approverRole: string
): Promise<void> {
  await createNotification({
    user_id: requesterId,
    notification_type: "request_approved",
    title: "Request Approved",
    message: `Your travel order request ${requestNumber} has been approved by ${approverRole}.`,
    related_type: "request",
    related_id: requestId,
    action_url: `/user/submissions`,
    action_label: "View Request",
    priority: "high",
  });
}

/**
 * Create notifications for request rejection
 */
export async function notifyRequestRejected(
  requestId: string,
  requestNumber: string,
  requesterId: string,
  approverRole: string,
  reason?: string
): Promise<void> {
  await createNotification({
    user_id: requesterId,
    notification_type: "request_rejected",
    title: "Request Rejected",
    message: `Your travel order request ${requestNumber} has been rejected by ${approverRole}.${reason ? ` Reason: ${reason}` : ""}`,
    related_type: "request",
    related_id: requestId,
    action_url: `/user/submissions`,
    action_label: "View Request",
    priority: "high",
  });
}

/**
 * Create notifications for request status change
 */
export async function notifyRequestStatusChange(
  requestId: string,
  requestNumber: string,
  userId: string,
  status: string,
  message?: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    notification_type: "request_status_change",
    title: "Request Status Updated",
    message: message || `Your travel order request ${requestNumber} status has been updated to ${status}.`,
    related_type: "request",
    related_id: requestId,
    action_url: `/user/submissions`,
    action_label: "View Request",
    priority: "normal",
  });
}

/**
 * Create notifications for vehicle/driver assignment
 */
export async function notifyAssignment(
  requestId: string,
  requestNumber: string,
  requesterId: string,
  vehicleName?: string,
  driverName?: string
): Promise<void> {
  const parts: string[] = [];
  if (vehicleName) parts.push(`Vehicle: ${vehicleName}`);
  if (driverName) parts.push(`Driver: ${driverName}`);
  
  await createNotification({
    user_id: requesterId,
    notification_type: "assignment",
    title: "Vehicle & Driver Assigned",
    message: `Your travel order request ${requestNumber} has been assigned. ${parts.join(", ")}`,
    related_type: "request",
    related_id: requestId,
    action_url: `/user/submissions`,
    action_label: "View Request",
    priority: "normal",
  });
}

