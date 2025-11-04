import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("users")
    .select("signature")
    .eq("auth_user_id", user.id)
    .single();

  return NextResponse.json({
    ok: true,
    signature: data?.signature || null,
  });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { signature } = await req.json();

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Signature required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ signature })
    .eq("auth_user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
