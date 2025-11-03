// src/app/api/head/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/head  → list all pending_head
export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  // get only those that are waiting for dept head
  const { data, error } = await supabase
    .from("requests")
    .select("id, created_by, current_status, payload")
    .eq("current_status", "pending_head")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/head error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

// PATCH /api/head  → approve / reject
export async function PATCH(req: Request) {
  const body = await req.json();
  const {
    id,
    action = "approve",
    head_name = "Department Head",
    head_signature = "signed-by-head",
  } = body as {
    id: string;
    action?: "approve" | "reject";
    head_name?: string;
    head_signature?: string;
  };

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient(true);

  const update: any = {
    updated_at: new Date().toISOString(),
    head_signed_by: head_name,
    head_signature: head_signature,
  };

  if (action === "approve") {
    update.current_status = "head_approved";
    update.status = "head_approved";
  } else {
    update.current_status = "head_rejected";
    update.status = "head_rejected";
  }

  const { data, error } = await supabase
    .from("requests")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/head error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
