// src/app/api/requests/list/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("supabase list error", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
