// src/app/api/requests/[id]/check-head-inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/requests/[id]/check-head-inbox
 * Check if a request is in a specific department head's inbox
 * Useful for verification without logging into the head's account
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;

    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[GET /api/requests/[id]/check-head-inbox] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        status,
        department_id,
        requester_id,
        updated_at,
        requester_signed_at,
        department:departments!department_id(id, name, code)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ 
        ok: false, 
        error: "Request not found" 
      }, { status: 404 });
    }

    // Get department heads for this department
    const { data: heads, error: headsError } = await supabase
      .from("users")
      .select("id, name, email, is_head, status")
      .eq("department_id", request.department_id)
      .eq("is_head", true)
      .eq("status", "active");

    const departmentHeads = heads || [];
    const isInHeadInbox = request.status === "pending_head" || request.status === "pending_parent_head";

    return NextResponse.json({
      ok: true,
      data: {
        request_number: request.request_number,
        status: request.status,
        department: request.department,
        is_in_head_inbox: isInHeadInbox,
        forwarded_at: request.updated_at,
        requester_signed_at: request.requester_signed_at,
        department_heads: departmentHeads.map((h: any) => ({
          name: h.name,
          email: h.email,
          is_active: h.status === "active"
        })),
        message: isInHeadInbox 
          ? `✅ YES - This request is in the department head's inbox (${request.department?.name || 'Unknown Department'})`
          : `❌ NO - This request is not in the head's inbox. Current status: ${request.status}`
      }
    });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/check-head-inbox] Error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message 
    }, { status: 500 });
  }
}

