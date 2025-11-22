// src/app/api/cron/evaluation-reminders/route.ts
/**
 * Cron job endpoint for sending evaluation reminders to requesters
 * who have not evaluated their completed trips
 * 
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * Check for completed trips without evaluations and send reminders
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if provided (for security)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(true);
    const now = getPhilippineTimestamp();
    
    // Find all completed/approved requests where travel_end_date has passed
    // and no feedback has been submitted
    const { data: completedRequests, error: fetchError } = await supabase
      .from("requests")
      .select(`
        id,
        requester_id,
        request_number,
        travel_end_date,
        status,
        requester:requester_id(id, name, email)
      `)
      .in("status", ["approved", "completed"])
      .lte("travel_end_date", now.toISOString())
      .order("travel_end_date", { ascending: false });

    if (fetchError) {
      console.error("[Evaluation Reminders] Error fetching completed requests:", fetchError);
      return NextResponse.json(
        { ok: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!completedRequests || completedRequests.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No completed trips found",
        reminders_sent: 0,
      });
    }

    let remindersSent = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Check each completed request for missing evaluations
    for (const request of completedRequests) {
      try {
        // Check if feedback already exists
        const { data: existingFeedback } = await supabase
          .from("feedback")
          .select("id")
          .eq("trip_id", request.id)
          .eq("user_id", request.requester_id)
          .maybeSingle();

        if (existingFeedback) {
          skipped++;
          continue; // Already evaluated
        }

        // Check if reminder notification was already sent in the last 7 days
        // (to avoid spamming)
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentNotification } = await supabase
          .from("notifications")
          .select("id, created_at")
          .eq("user_id", request.requester_id)
          .eq("notification_type", "evaluation_reminder")
          .eq("related_id", request.id)
          .gte("created_at", sevenDaysAgo.toISOString())
          .maybeSingle();

        if (recentNotification) {
          skipped++;
          continue; // Reminder already sent recently
        }

        // Calculate days since trip ended
        const travelEndDate = new Date(request.travel_end_date);
        const daysSinceTrip = Math.floor(
          (now.getTime() - travelEndDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send reminder if trip ended at least 1 day ago
        if (daysSinceTrip < 1) {
          skipped++;
          continue;
        }

        // Create evaluation reminder notification
        await createNotification({
          user_id: request.requester_id,
          notification_type: "evaluation_reminder",
          title: "Evaluation Reminder - Trip Completed",
          message: `You haven't evaluated your trip ${request.request_number || ''} yet. Please provide your feedback about the travel experience.`,
          related_type: "request",
          related_id: request.id,
          action_url: `/user/feedback?request_id=${request.id}`,
          action_label: "Evaluate Trip",
          priority: daysSinceTrip > 7 ? "urgent" : "high", // Urgent if more than 7 days
        });

        remindersSent++;
        console.log(
          `[Evaluation Reminders] ✅ Sent reminder for request ${request.id} (${daysSinceTrip} days since trip)`
        );
      } catch (error: any) {
        const errorMsg = `Failed to process request ${request.id}: ${error.message}`;
        console.error(`[Evaluation Reminders] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Evaluation reminders processed",
      reminders_sent: remindersSent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Evaluation Reminders] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

