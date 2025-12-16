// src/app/api/requests/[id]/duplicate/route.ts
/**
 * POST /api/requests/[id]/duplicate
 * Create a new draft request based on an existing request
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;

    if (!requestId || requestId === "undefined") {
      return NextResponse.json({ ok: false, error: "Invalid request ID" }, { status: 400 });
    }

    // Use service role for database operations
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("id, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get the original request
    const { data: originalRequest, error: fetchError } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !originalRequest) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Create new draft with copied data
    const now = new Date();
    const newRequest = {
      requester_id: profile.id,
      department_id: profile.department_id || originalRequest.department_id,
      status: "draft",
      purpose: originalRequest.purpose,
      destination: originalRequest.destination,
      departure_date: null, // User needs to set new dates
      return_date: null,
      departure_time: originalRequest.departure_time,
      return_time: originalRequest.return_time,
      number_of_passengers: originalRequest.number_of_passengers,
      passenger_names: originalRequest.passenger_names,
      vehicle_type_requested: originalRequest.vehicle_type_requested,
      special_requirements: originalRequest.special_requirements,
      estimated_distance: originalRequest.estimated_distance,
      total_estimated_cost: originalRequest.total_estimated_cost,
      cost_breakdown: originalRequest.cost_breakdown,
      requires_head_approval: originalRequest.requires_head_approval,
      requires_vp_approval: originalRequest.requires_vp_approval,
      requires_president_approval: originalRequest.requires_president_approval,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      // Clear all approval fields
      submitted_at: null,
      head_approved_at: null,
      admin_processed_at: null,
      comptroller_approved_at: null,
      hr_approved_at: null,
      vp_approved_at: null,
      president_approved_at: null,
      rejected_at: null,
      returned_at: null,
      completed_at: null,
    };

    const { data: newDraft, error: insertError } = await supabaseServiceRole
      .from("requests")
      .insert(newRequest)
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/requests/[id]/duplicate] Insert error:", insertError);
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    // Log the duplication
    await supabaseServiceRole.from("request_history").insert({
      request_id: newDraft.id,
      action: "created",
      actor_id: profile.id,
      actor_role: "requester",
      comments: `Duplicated from request ${originalRequest.request_number || requestId}`,
      metadata: {
        source_request_id: requestId,
        source_request_number: originalRequest.request_number,
      },
    });

    return NextResponse.json({
      ok: true,
      data: newDraft,
      message: "Request duplicated successfully",
    });
  } catch (error: any) {
    console.error("[POST /api/requests/[id]/duplicate] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
