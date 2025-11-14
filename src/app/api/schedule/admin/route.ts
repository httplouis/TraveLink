// src/app/api/schedule/admin/route.ts
/**
 * GET /api/schedule/admin
 * Fetch all requests for admin schedule view with full details
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (!profile.is_admin && profile.role !== 'admin')) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Fetch all requests with full details
    const { data: requests, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        purpose,
        destination,
        travel_start_date,
        travel_end_date,
        status,
        assigned_vehicle_id,
        assigned_driver_id,
        requester:users!requester_id(id, name, email, department),
        department:departments!requests_department_id_fkey(id, name, code),
        vehicle:vehicles!assigned_vehicle_id(id, vehicle_name, plate_number, type, capacity, status),
        driver:users!assigned_driver_id(id, name, email),
        participants
      `)
      .in("status", ["approved", "pending_admin", "pending_hr", "pending_exec"])
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[/api/schedule/admin] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Transform to schedule format
    const schedules = (requests || []).map((req: any) => {
      const startDate = new Date(req.travel_start_date);
      const endDate = new Date(req.travel_end_date);
      
      return {
        id: req.id,
        request_number: req.request_number,
        title: req.title || req.purpose,
        destination: req.destination,
        purpose: req.purpose,
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        requester: req.requester?.name || "Unknown",
        requesterEmail: req.requester?.email,
        department: req.department?.name || "Unknown",
        vehicle: req.vehicle?.vehicle_name || req.vehicle?.plate_number || "Not assigned",
        vehicleId: req.assigned_vehicle_id,
        vehicleStatus: req.vehicle?.status,
        driver: req.driver?.name || "Not assigned",
        driverId: req.assigned_driver_id,
        participants: req.participants || [],
        status: req.status === "approved" ? "PLANNED" : "PENDING",
      };
    });

    return NextResponse.json({ ok: true, data: schedules });
  } catch (err: any) {
    console.error("[/api/schedule/admin] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

