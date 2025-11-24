import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/vehicles/[id]
 * Get a single vehicle by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing vehicle ID" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for queries (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase configuration" },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("id, vehicle_name, plate_number, type, model, capacity, status, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/vehicles/[id]] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to fetch vehicle" },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found" },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(
      { ok: true, data: vehicle },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error("[GET /api/vehicles/[id]] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

