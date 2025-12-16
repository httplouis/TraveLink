// src/app/api/notifications/route.ts
/**
 * Notifications API - Full CRUD
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: Request) {
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { searchParams } = new URL(request.url);
    
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }
    
    // First, check if there are any notifications at all for this user
    const { count: totalCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id);
    
    console.log("[GET /api/notifications] Total notifications for user", profile.id, ":", totalCount);
    
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (unreadOnly) {
      query = query.or("is_read.is.null,is_read.eq.false");
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[GET /api/notifications] Error:", error);
      console.error("[GET /api/notifications] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    console.log("[GET /api/notifications] Found", data?.length || 0, "notifications for user", profile.id);
    if (data && data.length > 0) {
      console.log("[GET /api/notifications] Sample notification:", JSON.stringify(data[0], null, 2));
      console.log("[GET /api/notifications] All notifications:", data.map(n => ({
        id: n.id,
        title: n.title,
        notification_type: n.notification_type || n.kind, // Handle both schemas
        is_read: n.is_read,
        created_at: n.created_at
      })));
    } else {
      console.log("[GET /api/notifications] No notifications found, but total count is:", totalCount);
      // Try to get all notifications without filters to debug
      const { data: allData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .limit(5);
      console.log("[GET /api/notifications] Debug - All notifications (no filters):", allData);
    }
    
    // Normalize data to handle both old and new schema
    const normalizedData = (data || []).map(n => ({
      ...n,
      // Map old schema fields to new schema fields
      notification_type: n.notification_type || n.kind || 'info',
      message: n.message || n.body || '',
      action_url: n.action_url || n.link || null,
    }));
    
    return NextResponse.json({ ok: true, data: normalizedData });
  } catch (err: any) {
    console.error("[GET /api/notifications] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create new notification
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: body.user_id || body.userId,
        notification_type: body.notification_type || body.type,
        title: body.title,
        message: body.message,
        related_type: body.related_type || body.relatedType,
        related_id: body.related_id || body.relatedId,
        action_url: body.action_url || body.actionUrl,
        action_label: body.action_label || body.actionLabel,
        priority: body.priority || "normal",
        expires_at: body.expires_at || body.expiresAt,
      })
      .select()
      .single();
    
    if (error) {
      console.error("[POST /api/notifications] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[POST /api/notifications] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notification as read
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    const { id, ids, ...updates } = body;
    
    if (!id && !ids) {
      return NextResponse.json({ ok: false, error: "ID or IDs required" }, { status: 400 });
    }
    
    const dbUpdates: any = {};
    
    if (updates.is_read !== undefined || updates.isRead !== undefined) {
      dbUpdates.is_read = updates.is_read ?? updates.isRead;
      if (dbUpdates.is_read) {
        dbUpdates.read_at = new Date().toISOString();
      }
    }
    
    let query = supabase.from("notifications").update(dbUpdates);
    
    if (id) {
      query = query.eq("id", id);
    } else if (ids && Array.isArray(ids)) {
      query = query.in("id", ids);
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      console.error("[PATCH /api/notifications] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[PATCH /api/notifications] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications
 * Delete notification
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id");
    
    if (!id && !userId) {
      return NextResponse.json({ ok: false, error: "ID or user_id required" }, { status: 400 });
    }
    
    let query = supabase.from("notifications").delete();
    
    if (id) {
      query = query.eq("id", id);
    } else if (userId) {
      // Delete all read notifications for user
      query = query.eq("user_id", userId).eq("is_read", true);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error("[DELETE /api/notifications] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/notifications] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
