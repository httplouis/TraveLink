// src/app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();

  // pwedeng galing sa body.travelOrder or body.payload.travelOrder
  const travelOrder =
    body.travelOrder ?? body.payload?.travelOrder ?? body ?? {};
  const department = travelOrder.department as string | undefined;

  const supabase = await createSupabaseServerClient(true);

  // 1) find the head of THIS department
  let head: { id: string; email: string; full_name?: string } | null = null;
  if (department) {
    const { data: h } = await supabase
      .from("app_users")
      .select("id,email,full_name,department,role")
      .eq("role", "head")
      .eq("department", department)
      .maybeSingle();
    if (h) {
      head = {
        id: h.id,
        email: h.email,
        full_name: h.full_name ?? undefined,
      };
    }
  }

  // 2) insert the request
  const { data, error } = await supabase
    .from("requests")
    .insert({
      payload: { travelOrder },
      current_status: head ? "pending_head" : "submitted",
      assigned_head_id: head?.id ?? null,
      assigned_head_email: head?.email ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
