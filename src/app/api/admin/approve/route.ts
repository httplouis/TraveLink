// src/app/api/admin/approve/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile (try users table first, fallback to auth user)
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    // Use profile if exists, otherwise use auth user data
    const userId = profile?.id || user.id;
    const userName = profile?.name || user.email || "Admin User";
    
    console.log("[POST /api/admin/approve] User:", { userId, userName, hasProfile: !!profile });

    // Parse request body
    const body = await request.json();
    const { 
      requestId, 
      signature, 
      driver, 
      vehicle, 
      adminNotes,
      requiresComptroller 
    } = body;

    if (!requestId || !signature) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Get request
    const { data: req, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !req) {
      console.error("[POST /api/admin/approve] Request fetch error:", fetchError);
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Verify status is ready for admin approval
    const validStatuses = ["head_approved", "pending_admin", "admin_received"];
    if (!validStatuses.includes(req.status)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Request is in ${req.status} status, not ready for admin approval` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Determine next status based on budget
    const nextStatus = requiresComptroller ? "pending_comptroller" : "pending_hr";

    // Update request with admin approval
    const updateData: any = {
      status: nextStatus,
      current_approver_role: requiresComptroller ? "comptroller" : "hr",
      admin_approved_at: now,
      admin_processed_at: now, // For tracking timeline
      admin_approved_by: userId,
      admin_processed_by: userId, // For tracking timeline
      admin_signature: signature,
      admin_notes: adminNotes || null,
      admin_comments: adminNotes || null, // For tracking timeline
      assigned_driver_id: driver || null,
      assigned_vehicle_id: vehicle || null,
    };

    console.log(`[POST /api/admin/approve] Approving request ${requestId}: ${req.status} → ${nextStatus}`);
    console.log(`[POST /api/admin/approve] 🖊️ Signature length:`, signature?.length || 0);
    console.log(`[POST /api/admin/approve] 📝 Update data:`, JSON.stringify(updateData, null, 2));

    const { error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[POST /api/admin/approve] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log to request_history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "admin_approved",
      actor_id: userId,
      actor_role: "admin",
      previous_status: req.status,
      new_status: nextStatus,
      comments: adminNotes || `Admin approved by ${userName}, sent to ${requiresComptroller ? 'Comptroller' : 'HR'}`,
    });

    return NextResponse.json({ 
      ok: true, 
      data: { 
        id: requestId, 
        status: nextStatus,
        message: `Request approved and sent to ${requiresComptroller ? 'Comptroller' : 'HR'}`
      } 
    });

  } catch (error: any) {
    console.error("[POST /api/admin/approve] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
