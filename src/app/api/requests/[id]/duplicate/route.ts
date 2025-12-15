// src/app/api/requests/[id]/duplicate/route.ts
/**
 * POST /api/requests/[id]/duplicate
 * Duplicate a travel order/seminar application
 * Copies all fields except request_number, status, signatures
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

    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[POST /api/requests/[id]/duplicate] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
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

    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Get original request
    const { data: originalRequest, error: fetchError } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !originalRequest) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Check if user is the requester or admin
    const isRequester = originalRequest.requester_id === profile.id;
    const isAdmin = profile.is_admin;

    if (!isRequester && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "You can only duplicate your own requests" },
        { status: 403 }
      );
    }

    // Create duplicate - copy all fields except:
    // - id (new UUID will be generated)
    // - request_number (will be generated on submission)
    // - status (set to "draft")
    // - All approval fields (signatures, approved_by, approved_at)
    // - created_at, updated_at (will be set to now)
    // - file_code (will be generated on submission)

    const duplicateData: any = {
      requester_id: originalRequest.requester_id,
      department_id: originalRequest.department_id,
      request_type: originalRequest.request_type,
      purpose: originalRequest.purpose,
      destination: originalRequest.destination,
      travel_start_date: originalRequest.travel_start_date,
      travel_end_date: originalRequest.travel_end_date,
      passengers: originalRequest.passengers,
      total_budget: originalRequest.total_budget,
      expense_breakdown: originalRequest.expense_breakdown,
      cost_justification: originalRequest.cost_justification,
      seminar_data: originalRequest.seminar_data,
      attachments: originalRequest.attachments || [],
      needs_vehicle: originalRequest.needs_vehicle,
      needs_rental: originalRequest.needs_rental,
      has_budget: originalRequest.has_budget,
      vehicle_mode: originalRequest.vehicle_mode,
      pickup_location: originalRequest.pickup_location,
      pickup_time: originalRequest.pickup_time,
      pickup_preference: originalRequest.pickup_preference,
      preferred_driver_id: originalRequest.preferred_driver_id,
      preferred_vehicle_id: originalRequest.preferred_vehicle_id,
      is_international: originalRequest.is_international,
      status: "draft", // Always start as draft
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert duplicate
    const { data: duplicatedRequest, error: insertError } = await supabaseServiceRole
      .from("requests")
      .insert(duplicateData)
      .select()
      .single();

    if (insertError) {
      console.error("[Duplicate Request] Insert error:", insertError);
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Copy requester invitations if any
    if (originalRequest.request_type === "travel_order") {
      const { data: invitations } = await supabaseServiceRole
        .from("requester_invitations")
        .select("*")
        .eq("request_id", requestId);

      if (invitations && invitations.length > 0) {
        const duplicateInvitations = invitations.map((inv) => ({
          request_id: duplicatedRequest.id,
          user_id: inv.user_id,
          department_id: inv.department_id,
          name: inv.name,
          email: inv.email,
          status: "pending", // Reset to pending
          invited_at: new Date().toISOString(),
        }));

        await supabaseServiceRole
          .from("requester_invitations")
          .insert(duplicateInvitations);
      }
    }

    // Copy participant invitations if seminar
    if (originalRequest.request_type === "seminar") {
      const { data: participants } = await supabaseServiceRole
        .from("participant_invitations")
        .select("*")
        .eq("request_id", requestId);

      if (participants && participants.length > 0) {
        const duplicateParticipants = participants.map((part) => ({
          request_id: duplicatedRequest.id,
          user_id: part.user_id,
          name: part.name,
          email: part.email,
          status: "pending", // Reset to pending
          invited_at: new Date().toISOString(),
        }));

        await supabaseServiceRole
          .from("participant_invitations")
          .insert(duplicateParticipants);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: duplicatedRequest.id,
        message: "Request duplicated successfully",
      },
    });
  } catch (error: any) {
    console.error("[Duplicate Request] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to duplicate request" },
      { status: 500 }
    );
  }
}

