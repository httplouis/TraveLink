// Get request history/tracking for a specific request
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const requestId = params.id;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments!department_id(id, code, name)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("[GET /api/requests/[id]/history] Request error:", requestError);
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Get request history
    const { data: history, error: historyError } = await supabase
      .from("request_history")
      .select(`
        *,
        actor:users!actor_id(id, name, email)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("[GET /api/requests/[id]/history] History error:", historyError);
      // Don't fail if history is missing, just return empty array
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        request,
        history: history || []
      }
    });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/history] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
