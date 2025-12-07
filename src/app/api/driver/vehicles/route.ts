// src/app/api/driver/vehicles/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/driver/vehicles
 * Get vehicles assigned to the current driver
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get driver profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_driver, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (!profile.is_driver && profile.role !== "driver")) {
      return NextResponse.json({ ok: false, error: "Driver profile not found" }, { status: 404 });
    }

    const driverId = profile.id;

    // Get vehicles assigned to this driver (from requests)
    const { data: assignedRequests } = await supabase
      .from("requests")
      .select(`
        assigned_vehicle_id,
        assigned_vehicle:vehicles(
          id,
          vehicle_name,
          model,
          plate_number,
          type,
          status
        )
      `)
      .eq("assigned_driver_id", driverId)
      .not("assigned_vehicle_id", "is", null)
      .in("status", ["approved", "pending_admin", "pending_comptroller", "pending_hr", "pending_vp", "pending_exec"]);

    // Get unique vehicles
    const vehicleMap = new Map();
    assignedRequests?.forEach((req: any) => {
      if (req.assigned_vehicle && !vehicleMap.has(req.assigned_vehicle.id)) {
        vehicleMap.set(req.assigned_vehicle.id, req.assigned_vehicle);
      }
    });

    const vehicles = Array.from(vehicleMap.values());

    // Get maintenance logs for each vehicle
    const vehiclesWithLogs = await Promise.all(
      vehicles.map(async (vehicle: any) => {
        const { data: maintenanceLogs } = await supabase
          .from("vehicle_maintenance")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("completed_date", { ascending: false })
          .limit(5);

        // Get last maintenance date
        const lastMaintenance = maintenanceLogs?.find((log: any) => log.completed_date)?.completed_date || null;
        
        // Calculate next due date (assuming 3 months from last maintenance)
        let nextDue = null;
        if (lastMaintenance) {
          const lastDate = new Date(lastMaintenance);
          lastDate.setMonth(lastDate.getMonth() + 3);
          nextDue = lastDate.toISOString().split('T')[0];
        }

        return {
          ...vehicle,
          last_maintenance_date: lastMaintenance,
          next_maintenance_date: nextDue,
          maintenance_logs: maintenanceLogs?.map((log: any) => ({
            id: log.id,
            date: log.completed_date || log.scheduled_date,
            category: log.maintenance_type,
            odometer: log.odometer_reading || null,
            description: log.description,
            nextDueDate: nextDue,
          })) || [],
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: vehiclesWithLogs,
    });
  } catch (err: any) {
    console.error("[GET /api/driver/vehicles] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

