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

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Save signature to user profile - ALL users can save their signature
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

