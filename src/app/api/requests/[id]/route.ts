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

    // Fetch full request details with all approver information
    const { data: request, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(
          id, name, email, profile_picture, phone_number, 
          position_title, department_id,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        department:departments!department_id(id, code, name),
        submitted_by:users!submitted_by_user_id(
          id, name, email, profile_picture, phone_number, position_title
        ),
        head_approver:users!head_approved_by(
          id, name, email, profile_picture, phone_number, position_title,
          department_id,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        admin_approver:users!admin_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        comptroller_approver:users!comptroller_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        hr_approver:users!hr_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        vp_approver:users!vp_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        president_approver:users!president_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        exec_approver:users!exec_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        )
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
    console.log(`[GET /api/requests/${requestId}] Preferred driver ID:`, request.preferred_driver_id);
    console.log(`[GET /api/requests/${requestId}] Preferred vehicle ID:`, request.preferred_vehicle_id);
    
    if (request.preferred_driver_id || request.preferred_vehicle_id) {
      // Fetch driver name
      if (request.preferred_driver_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching driver name for ID:`, request.preferred_driver_id);
        const { data: driver, error: driverError } = await supabase
          .from("users")
          .select("name")
          .eq("id", request.preferred_driver_id)
          .single();
        
        if (driverError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching driver:`, driverError);
        }
        
        if (driver) {
          request.preferred_driver_name = driver.name;
          console.log(`[GET /api/requests/${requestId}] Driver name found:`, driver.name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Driver not found for ID:`, request.preferred_driver_id);
        }
      }

      // Fetch vehicle name
      if (request.preferred_vehicle_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching vehicle for ID:`, request.preferred_vehicle_id);
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select("vehicle_name, plate_number")
          .eq("id", request.preferred_vehicle_id)
          .single();
        
        if (vehicleError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching vehicle:`, vehicleError);
        }
        
        if (vehicle) {
          request.preferred_vehicle_name = `${vehicle.vehicle_name} • ${vehicle.plate_number}`;
          console.log(`[GET /api/requests/${requestId}] Vehicle found:`, request.preferred_vehicle_name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Vehicle not found for ID:`, request.preferred_vehicle_id);
        }
      }
    } else {
      console.log(`[GET /api/requests/${requestId}] No driver or vehicle preferences set`);
    }

    return NextResponse.json({ ok: true, data: request });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
