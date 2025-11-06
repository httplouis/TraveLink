// Get full request details by ID
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

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Fetch full request details
    const { data: request, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments!department_id(id, code, name),
        submitted_by:users!submitted_by_user_id(id, name, email)
      `)
      .eq("id", requestId)
      .single();

    if (error) {
      console.error("[GET /api/requests/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Fetch driver and vehicle names if IDs are present
    if (request.preferred_driver_id || request.preferred_vehicle_id) {
      // Fetch driver name
      if (request.preferred_driver_id) {
        const { data: driver } = await supabase
          .from("users")
          .select("name")
          .eq("id", request.preferred_driver_id)
          .single();
        
        if (driver) {
          request.preferred_driver_name = driver.name;
        }
      }

      // Fetch vehicle name
      if (request.preferred_vehicle_id) {
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("vehicle_name, plate_number")
          .eq("id", request.preferred_vehicle_id)
          .single();
        
        if (vehicle) {
          request.preferred_vehicle_name = `${vehicle.vehicle_name} • ${vehicle.plate_number}`;
        }
      }
    }

    return NextResponse.json({ ok: true, data: request });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
