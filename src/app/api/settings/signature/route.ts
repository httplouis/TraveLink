// src/app/api/settings/signature/route.ts
/**
 * GET /api/settings/signature - Get saved signature
 * POST /api/settings/signature - Save signature
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("signature_url")
      .eq("auth_user_id", user.id)
      .single();

    return NextResponse.json({ 
      ok: true, 
      data: { signature: profile?.signature_url || null } 
    });
  } catch (err: any) {
    console.error("[/api/settings/signature] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    const { signature } = body;

    if (!signature) {
      return NextResponse.json({ ok: false, error: "Signature required" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can sign (head, hr, exec, comptroller, admin)
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_head, is_hr, is_exec, is_admin, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const canSign = profile.is_head || profile.is_hr || profile.is_exec || profile.is_admin || 
                    profile.role === 'comptroller';
    
    if (!canSign) {
      return NextResponse.json({ ok: false, error: "You don't have permission to save signatures" }, { status: 403 });
    }

    // Save signature to user profile
    const { error: updateError } = await supabase
      .from("users")
      .update({ signature_url: signature })
      .eq("auth_user_id", user.id);

    if (updateError) {
      console.error("[/api/settings/signature] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Signature saved successfully" });
  } catch (err: any) {
    console.error("[/api/settings/signature] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

