// src/app/api/requests/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: requestId } = await Promise.resolve(params);
    
    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[POST /api/requests/[id]/cancel] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }
    
    const body = await req.json();
    const { reason, password } = body;

    // Validate required fields
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ 
        ok: false, 
        error: "Cancellation reason is required" 
      }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get request
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: request, error: fetchError } = await supabaseServiceRole
      .from("requests")
      .select("id, status, requester_id, submitted_by_user_id, request_number")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if already cancelled or completed
    if (request.status === "cancelled") {
      return NextResponse.json({ 
        ok: false, 
        error: "Request is already cancelled" 
      }, { status: 400 });
    }

    if (request.status === "completed") {
      return NextResponse.json({ 
        ok: false, 
        error: "Cannot cancel a completed request" 
      }, { status: 400 });
    }

    // Check permissions
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "comptroller@mseuf.edu.ph"];
    const isAdmin = adminEmails.includes(profile.email) || profile.is_admin;
    const isRequester = request.requester_id === profile.id || request.submitted_by_user_id === profile.id;

    // Admin requires password confirmation
    if (isAdmin) {
      if (!password || password.trim() === "") {
        return NextResponse.json({ 
          ok: false, 
          error: "Password confirmation required for admin cancellation" 
        }, { status: 400 });
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
        password: password,
      });

      if (signInError) {
        return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
      }
    }

    // Requester can cancel their own requests (no password needed)
    if (!isAdmin && !isRequester) {
      return NextResponse.json({ 
        ok: false, 
        error: "Only admins or requesters can cancel requests" 
      }, { status: 403 });
    }

    // Update request status to cancelled
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseServiceRole
      .from("requests")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancelled_by: profile.id,
        cancellation_reason: reason.trim(),
        updated_at: now,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("[POST /api/requests/[id]/cancel] Update error:", updateError);
      return NextResponse.json({ 
        ok: false, 
        error: updateError.message 
      }, { status: 500 });
    }

    // Log to request_history
    await supabaseServiceRole.from("request_history").insert({
      request_id: requestId,
      action: "cancelled",
      actor_id: profile.id,
      actor_role: isAdmin ? "admin" : "requester",
      previous_status: request.status,
      new_status: "cancelled",
      comments: `Request cancelled: ${reason.trim()}`,
      metadata: {
        cancellation_reason: reason.trim(),
        cancelled_at: now,
        cancelled_by: profile.id,
        cancelled_by_role: isAdmin ? "admin" : "requester",
      }
    });

    // Send notification to requester
    try {
      const { notifyRequestCancelled } = await import("@/lib/notifications/helpers");
      await notifyRequestCancelled(
        requestId,
        request.request_number || requestId,
        request.requester_id,
        isAdmin ? profile.email || "Admin" : "Requester",
        reason.trim()
      );
    } catch (notifError) {
      console.error("[POST /api/requests/[id]/cancel] Failed to send notification:", notifError);
      // Don't fail the cancellation if notification fails
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Request cancelled successfully" 
    });
  } catch (err: any) {
    console.error("[POST /api/requests/[id]/cancel] Unexpected error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Failed to cancel request" 
    }, { status: 500 });
  }
}

