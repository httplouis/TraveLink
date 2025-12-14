// src/app/api/feedback/route.ts
/**
 * Feedback API - Full CRUD
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/feedback
 * List all feedback with filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (category) {
      query = query.eq("category", category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[GET /api/feedback] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[GET /api/feedback] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/feedback
 * Create new feedback
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    
    // Log incoming data for debugging
    console.log("[POST /api/feedback] Received body:", {
      user_id: body.user_id || body.userId,
      trip_id: body.trip_id || body.tripId,
      category: body.category,
      rating: body.rating,
      message: body.message?.substring(0, 50) + "...",
    });
    
    // Validate required fields
    if (!body.message || body.message.trim().length < 10) {
      return NextResponse.json({ ok: false, error: "Message must be at least 10 characters" }, { status: 400 });
    }
    
    const insertData: any = {
      user_id: body.user_id || body.userId || null,
      user_name: body.user_name || body.userName || "Anonymous",
      user_email: body.user_email || body.userEmail || null,
      trip_id: body.trip_id || body.tripId || null,
      driver_id: body.driver_id || body.driverId || null,
      vehicle_id: body.vehicle_id || body.vehicleId || null,
      rating: body.rating || null,
      message: body.message,
      category: body.category || "general",
      status: "new",
    };
    
    // Log what we're inserting
    console.log("[POST /api/feedback] Inserting:", insertData);
    
    const { data, error } = await supabase
      .from("feedback")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error("[POST /api/feedback] Supabase error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    console.log("[POST /api/feedback] Success! Inserted feedback ID:", data?.id);
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[POST /api/feedback] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/feedback
 * Update feedback (admin response)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID required" }, { status: 400 });
    }
    
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.admin_response || updates.adminResponse) {
      dbUpdates.admin_response = updates.admin_response || updates.adminResponse;
      dbUpdates.responded_at = new Date().toISOString();
    }
    if (updates.responded_by || updates.respondedBy) dbUpdates.responded_by = updates.responded_by || updates.respondedBy;
    
    const { data, error } = await supabase
      .from("feedback")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("[PATCH /api/feedback] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[PATCH /api/feedback] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/feedback
 * Delete feedback
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID required" }, { status: 400 });
    }
    
    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("[DELETE /api/feedback] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/feedback] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
