// Get request history/tracking for a specific request
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;

    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[GET /api/requests/[id]/history] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
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
        actor:users!request_history_actor_id_fkey(id, name, email)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("[GET /api/requests/[id]/history] History error:", historyError);
      // Try without join if FK join fails
      const { data: historyNoJoin, error: historyErrorNoJoin } = await supabase
        .from("request_history")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      
      if (!historyErrorNoJoin && historyNoJoin) {
        // Fetch actor names separately
        const actorIds = [...new Set(historyNoJoin.map((h: any) => h.actor_id).filter(Boolean))];
        const actorsMap: Record<string, any> = {};
        
        if (actorIds.length > 0) {
          const { data: actors } = await supabase
            .from("users")
            .select("id, name, email")
            .in("id", actorIds);
          
          if (actors) {
            actors.forEach((a: any) => {
              actorsMap[a.id] = a;
            });
          }
        }
        
        const historyWithActors = historyNoJoin.map((h: any) => ({
          ...h,
          actor: h.actor_id ? actorsMap[h.actor_id] : null
        }));
        
        console.log("[GET /api/requests/[id]/history] History loaded without join:", historyWithActors.length, "entries");
        return NextResponse.json({ 
          ok: true, 
          data: {
            request,
            history: historyWithActors
          }
        });
      }
    }

    console.log("[GET /api/requests/[id]/history] History loaded:", history?.length || 0, "entries");
    if (history && history.length > 0) {
      console.log("[GET /api/requests/[id]/history] First entry:", history[0].action, "by", history[0].actor?.name || history[0].actor_id);
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
