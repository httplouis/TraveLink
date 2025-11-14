import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/user/inbox/sign
 * Sign a request and forward it to department head
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { requestId, signature } = body;

    if (!requestId || !signature) {
      return NextResponse.json({ ok: false, error: "Request ID and signature are required" }, { status: 400 });
    }

    // Verify this request belongs to the current user and is pending their signature
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .eq("requester_id", profile.id)
      .eq("status", "pending_requester_signature")
      .single();

    if (requestError || !request) {
      return NextResponse.json({ 
        ok: false, 
        error: "Request not found or not pending your signature" 
      }, { status: 404 });
    }

    // Update request: add signature and change status to pending_head
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        requester_signature: signature,
        status: "pending_head", // Forward to department head
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("[User Inbox Sign] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    console.log(`[User Inbox Sign] Request ${requestId} signed by ${profile.name} and forwarded to department head`);

    return NextResponse.json({ 
      ok: true, 
      message: "Request signed and forwarded to department head" 
    });
  } catch (err: any) {
    console.error("[User Inbox Sign] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

