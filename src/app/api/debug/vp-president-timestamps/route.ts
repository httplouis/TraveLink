import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    const requestNumber = searchParams.get('request_number');

    if (!requestNumber) {
      return NextResponse.json({ error: "request_number is required" }, { status: 400 });
    }

    const { data: request, error } = await supabase
      .from("requests")
      .select(`
        id, 
        request_number, 
        status,
        vp_approved_at, 
        vp_approved_by,
        president_approved_at, 
        president_approved_by,
        exec_approved_at,
        exec_approved_by,
        final_approved_at,
        created_at,
        updated_at
      `)
      .eq("request_number", requestNumber)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true,
      request_number: requestNumber,
      raw_timestamps: {
        vp_approved_at: request?.vp_approved_at,
        president_approved_at: request?.president_approved_at,
        exec_approved_at: request?.exec_approved_at,
        final_approved_at: request?.final_approved_at,
        created_at: request?.created_at,
        updated_at: request?.updated_at
      },
      field_types: {
        vp_approved_at_type: typeof request?.vp_approved_at,
        president_approved_at_type: typeof request?.president_approved_at,
        exec_approved_at_type: typeof request?.exec_approved_at
      },
      formatted_timestamps: {
        vp_approved_at: request?.vp_approved_at ? new Date(request.vp_approved_at).toISOString() : null,
        president_approved_at: request?.president_approved_at ? new Date(request.president_approved_at).toISOString() : null,
        exec_approved_at: request?.exec_approved_at ? new Date(request.exec_approved_at).toISOString() : null,
        final_approved_at: request?.final_approved_at ? new Date(request.final_approved_at).toISOString() : null
      },
      approvers: {
        vp_approved_by: request?.vp_approved_by,
        president_approved_by: request?.president_approved_by,
        exec_approved_by: request?.exec_approved_by
      },
      status: request?.status
    });

  } catch (err: any) {
    console.error("[DEBUG VP/President timestamps]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
