// src/app/api/notifications/route.ts
/**
 * Notifications API - Full CRUD
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }
    
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (unreadOnly) {
      query = query.eq("is_read", false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[GET /api/notifications] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data: data || [] });
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
