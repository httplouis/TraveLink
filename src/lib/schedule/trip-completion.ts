/**
 * Trip Completion Logic
 * Automatically completes trips after travel date
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Auto-complete trips that have passed their travel date
 * Should be called by a cron job or scheduled function
 */
export async function autoCompleteTrips(): Promise<{
  completed: number;
  errors: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  let completed = 0;
  let errors = 0;

  try {
    // Find all approved requests with travel_end_date <= today that are not already completed
    const { data: tripsToComplete, error: fetchError } = await supabase
      .from("requests")
      .select("id, request_number, travel_end_date, status, requester_id")
      .eq("status", "approved")
      .lte("travel_end_date", today.toISOString());

    if (fetchError) {
      console.error("[Auto-Complete Trips] Error fetching trips:", fetchError);
      return { completed: 0, errors: 1 };
    }

    if (!tripsToComplete || tripsToComplete.length === 0) {
      console.log("[Auto-Complete Trips] No trips to complete");
      return { completed: 0, errors: 0 };
    }

    console.log(`[Auto-Complete Trips] Found ${tripsToComplete.length} trips to complete`);

    // Update each trip to completed status
    for (const trip of tripsToComplete) {
      try {
        const { error: updateError } = await supabase
          .from("requests")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", trip.id);

        if (updateError) {
          console.error(`[Auto-Complete Trips] Error completing trip ${trip.id}:`, updateError);
          errors++;
          continue;
        }

        // Log to request_history
        await supabase.from("request_history").insert({
          request_id: trip.id,
          action: "auto_completed",
          actor_id: null, // System action
          actor_role: "system",
          previous_status: trip.status,
          new_status: "completed",
          comments: "Trip automatically completed after travel end date",
          metadata: {
            travel_end_date: trip.travel_end_date,
            completed_at: new Date().toISOString(),
          },
        });

        // Create notification for requester
        try {
          const { createNotification } = await import("@/lib/notifications/helpers");

          if (trip.requester_id) {
            await createNotification({
              user_id: trip.requester_id,
              notification_type: "trip_completed",
              title: "Trip Completed",
              message: `Your trip ${trip.request_number || ""} has been completed. Please provide feedback.`,
              related_type: "request",
              related_id: trip.id,
              action_url: `/user/feedback?request_id=${trip.id}`,
              action_label: "Provide Feedback",
              priority: "normal",
            });
          }
        } catch (notifError: any) {
          console.error(`[Auto-Complete Trips] Failed to create notification for trip ${trip.id}:`, notifError);
        }

        completed++;
        console.log(`[Auto-Complete Trips] ✅ Completed trip ${trip.request_number || trip.id}`);
      } catch (err: any) {
        console.error(`[Auto-Complete Trips] Error processing trip ${trip.id}:`, err);
        errors++;
      }
    }

    console.log(`[Auto-Complete Trips] ✅ Completed ${completed} trips, ${errors} errors`);
    return { completed, errors };
  } catch (error: any) {
    console.error("[Auto-Complete Trips] Fatal error:", error);
    return { completed, errors: errors + 1 };
  }
}

