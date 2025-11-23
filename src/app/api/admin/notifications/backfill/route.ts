// src/app/api/admin/notifications/backfill/route.ts
/**
 * POST /api/admin/notifications/backfill
 * Backfill notifications for existing pending_admin requests
 * This fixes the issue where existing requests don't have notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (!profile.is_admin && profile.role !== "admin")) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Verify password is required for bulk operations
    const body = await request.json().catch(() => ({}));
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Password confirmation required" }, { status: 400 });
    }

    // Verify password by attempting to sign in
    const cookieStore = await cookies();
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: user.email!,
      password: body.password,
    });

    if (signInError) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }

    console.log("[POST /api/admin/notifications/backfill] Starting backfill...");

    // 1. Get all active admins
    const { data: admins, error: adminsError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "admin")
      .eq("is_admin", true)
      .eq("status", "active");

    if (adminsError) {
      console.error("[POST /api/admin/notifications/backfill] Failed to fetch admins:", adminsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch admins" }, { status: 500 });
    }

    if (!admins || admins.length === 0) {
      return NextResponse.json({ ok: false, error: "No active admins found" }, { status: 404 });
    }

    console.log(`[POST /api/admin/notifications/backfill] Found ${admins.length} admin(s)`);

    // 2. Get all pending_admin requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from("requests")
      .select("id, request_number, requester_name, requester_id, created_at")
      .eq("status", "pending_admin")
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("[POST /api/admin/notifications/backfill] Failed to fetch requests:", requestsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch requests" }, { status: 500 });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        data: { 
          message: "No pending_admin requests found",
          notificationsCreated: 0,
          requestsProcessed: 0
        } 
      });
    }

    console.log(`[POST /api/admin/notifications/backfill] Found ${pendingRequests.length} pending_admin request(s)`);

    // 3. For each request, check existing notifications and create missing ones
    let notificationsCreated = 0;
    let requestsProcessed = 0;

    for (const req of pendingRequests) {
      // Check existing notifications for this request
      const { data: existingNotifications, error: notifError } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("related_type", "request")
        .eq("related_id", req.id)
        .eq("notification_type", "request_pending_signature");

      if (notifError) {
        console.error(`[POST /api/admin/notifications/backfill] Error checking notifications for request ${req.id}:`, notifError);
        continue;
      }

      const notifiedAdminIds = new Set(
        (existingNotifications || []).map((n: any) => n.user_id)
      );

      // Get requester name
      const requestingPersonName = req.requester_name || "Requester";

      // Create notifications for admins that don't have one yet
      const notificationsToCreate = admins
        .filter((admin: any) => !notifiedAdminIds.has(admin.id))
        .map((admin: any) =>
          createNotification({
            user_id: admin.id,
            notification_type: "request_pending_signature",
            title: "New Request Requires Review",
            message: `A travel order request ${req.request_number || ''} from ${requestingPersonName} requires your review.`,
            related_type: "request",
            related_id: req.id,
            action_url: `/admin/requests?view=${req.id}`,
            action_label: "Review Request",
            priority: "high",
          })
        );

      if (notificationsToCreate.length > 0) {
        const results = await Promise.allSettled(notificationsToCreate);
        const successful = results.filter((r) => r.status === "fulfilled" && r.value).length;
        notificationsCreated += successful;
        console.log(`[POST /api/admin/notifications/backfill] Created ${successful} notification(s) for request ${req.id}`);
      }

      requestsProcessed++;
    }

    console.log(`[POST /api/admin/notifications/backfill] ✅ Backfill complete: ${notificationsCreated} notifications created for ${requestsProcessed} requests`);

    return NextResponse.json({
      ok: true,
      data: {
        message: `Backfill complete: ${notificationsCreated} notifications created for ${requestsProcessed} requests`,
        notificationsCreated,
        requestsProcessed,
        adminsCount: admins.length,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/admin/notifications/backfill] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to backfill notifications" },
      { status: 500 }
    );
  }
}

