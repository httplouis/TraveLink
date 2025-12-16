// src/app/api/notifications/test/route.ts
/**
 * Test endpoint to verify notification creation
 * GET /api/notifications/test
 */
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Get authenticated user
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const supabase = await createSupabaseServerClient(true);
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Create a test notification for the current user
    // Note: related_id is UUID type, so we don't include it for test notifications
    const testNotification = {
      user_id: profile.id,
      notification_type: "request_approved",
      title: "Test Approval Notification",
      message: `This is a test notification to verify the notification system is working. Created at ${new Date().toISOString()}`,
      related_type: "test",
      // related_id omitted - it's UUID type and we don't have a real request ID for testing
      action_url: "/user/submissions",
      action_label: "View Test",
      priority: "high" as const,
    };

    console.log("[Notification Test] Creating test notification for user:", profile.id);
    const result = await createNotification(testNotification);

    if (result) {
      return NextResponse.json({
        ok: true,
        message: "Test notification created successfully",
        data: {
          user_id: profile.id,
          user_name: profile.name,
          notification: testNotification
        }
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: "Failed to create test notification - check server logs for details",
        data: {
          user_id: profile.id,
          user_name: profile.name
        }
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[Notification Test] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
