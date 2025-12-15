// src/app/api/admin/habol/route.ts
/**
 * Habol (Catch-up) Travel Orders API
 * Allows admin to link multiple travel orders with same destination/vehicle
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/habol
 * Find requests that can be linked (same destination, date range, vehicle needs)
 */
export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth (NOT service role - it doesn't have session info)
    const supabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("request_id");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");

    if (!requestId && !destination) {
      return NextResponse.json(
        { ok: false, error: "Missing request_id or destination parameter" },
        { status: 400 }
      );
    }

    // If request_id provided, get that request's details
    let baseRequest = null;
    if (requestId) {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { ok: false, error: "Request not found" },
          { status: 404 }
        );
      }

      baseRequest = data;
    }

    // Build query to find linkable requests
    let query = supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        destination,
        travel_start_date,
        travel_end_date,
        requester_id,
        requester_name,
        status,
        needs_vehicle,
        assigned_vehicle_id,
        assigned_driver_id,
        department_id,
        departments:department_id(id, name, code),
        requester:requester_id(id, name, email, profile_picture)
      `)
      .in("status", ["pending_admin", "pending_comptroller", "approved"])
      .eq("needs_vehicle", true);

    // Filter by destination if provided
    if (baseRequest) {
      query = query.eq("destination", baseRequest.destination);
      // Exclude the base request itself
      query = query.neq("id", baseRequest.id);
    } else if (destination) {
      query = query.eq("destination", destination);
    }

    // Filter by date if provided (find requests on same day or overlapping dates)
    if (baseRequest && baseRequest.travel_start_date) {
      const startDate = new Date(baseRequest.travel_start_date);
      const endDate = new Date(baseRequest.travel_end_date || baseRequest.travel_start_date);
      
      // Find requests that overlap with the date range
      query = query
        .lte("travel_start_date", endDate.toISOString())
        .gte("travel_end_date", startDate.toISOString());
    } else if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query = query
        .lte("travel_start_date", nextDay.toISOString())
        .gte("travel_end_date", searchDate.toISOString());
    }

    const { data: linkableRequests, error: queryError } = await query;

    if (queryError) {
      console.error("[Habol API] Query error:", queryError);
      return NextResponse.json(
        { ok: false, error: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        base_request: baseRequest,
        linkable_requests: linkableRequests || [],
      },
    });
  } catch (error: any) {
    console.error("[Habol API] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/habol
 * Link multiple requests together (assign same driver/vehicle)
 */
export async function POST(req: NextRequest) {
  try {
    // Use regular client for auth (NOT service role - it doesn't have session info)
    const supabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { parent_request_id, linked_request_ids, driver_id, vehicle_id } = body;

    if (!parent_request_id || !Array.isArray(linked_request_ids) || linked_request_ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!driver_id || !vehicle_id) {
      return NextResponse.json(
        { ok: false, error: "Driver and vehicle must be assigned" },
        { status: 400 }
      );
    }

    // Verify parent request exists
    const { data: parentRequest, error: parentError } = await supabase
      .from("requests")
      .select("id, destination, travel_start_date, travel_end_date")
      .eq("id", parent_request_id)
      .single();

    if (parentError || !parentRequest) {
      return NextResponse.json(
        { ok: false, error: "Parent request not found" },
        { status: 404 }
      );
    }

    // Update all linked requests to point to parent and assign driver/vehicle
    const updates = linked_request_ids.map((requestId: string) => ({
      id: requestId,
      parent_request_id: parent_request_id,
      assigned_driver_id: driver_id,
      assigned_vehicle_id: vehicle_id,
      admin_processed_by: profile.id,
      admin_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Also update parent request
    updates.push({
      id: parent_request_id,
      assigned_driver_id: driver_id,
      assigned_vehicle_id: vehicle_id,
      admin_processed_by: profile.id,
      admin_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update all requests
    for (const update of updates) {
      const { id, ...updateData } = update;
      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error(`[Habol API] Error updating request ${id}:`, updateError);
        return NextResponse.json(
          { ok: false, error: `Failed to update request ${id}` },
          { status: 500 }
        );
      }

      // Log to request_history
      await supabase.from("request_history").insert({
        request_id: id,
        action: "habol_linked",
        actor_id: profile.id,
        actor_role: "admin",
        previous_status: null,
        new_status: null,
        comments: `Linked to parent request ${parent_request_id} with same vehicle/driver`,
        metadata: {
          parent_request_id,
          linked_with: linked_request_ids.filter((rid: string) => rid !== id),
          driver_id,
          vehicle_id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully linked ${linked_request_ids.length} requests to parent`,
      data: {
        parent_request_id,
        linked_count: linked_request_ids.length,
      },
    });
  } catch (error: any) {
    console.error("[Habol API] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

