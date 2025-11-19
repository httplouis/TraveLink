// src/app/api/schedule/availability/route.ts
/**
 * GET /api/schedule/availability
 * Get schedule availability with pending/approved status for calendar view
 * Returns slot counts per date with status breakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_SLOTS_PER_DAY = 5;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear());

    // Get all requests for the month (all statuses)
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    // Only show requests that:
    // 1. Admin (TM) has processed (admin_processed_by is not null)
    // 2. Vehicle has been assigned (assigned_vehicle_id is not null)
    // 3. Driver has been assigned (assigned_driver_id is not null)
    // This ensures only approved and fully assigned requests appear in calendar
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
        requester_id,
        requester_name,
        department_id,
        departments:departments!requests_department_id_fkey(name, code),
        assigned_vehicle_id,
        assigned_driver_id,
        admin_processed_by,
        admin_processed_at
      `)
      .gte("travel_start_date", startDate)
      .lte("travel_start_date", endDate)
      .not("admin_processed_by", "is", null) // Admin must have processed
      .not("assigned_vehicle_id", "is", null) // Vehicle must be assigned
      .not("assigned_driver_id", "is", null) // Driver must be assigned
      .not("status", "in", "(rejected,cancelled)") // Exclude rejected/cancelled
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[GET /api/schedule/availability] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Fetch vehicle and driver data separately
    const vehicleIds = [...new Set((requests || []).map((r: any) => r.assigned_vehicle_id).filter(Boolean))];
    const driverIds = [...new Set((requests || []).map((r: any) => r.assigned_driver_id).filter(Boolean))];

    const [vehiclesResult, driversResult] = await Promise.all([
      vehicleIds.length > 0 
        ? supabase.from("vehicles").select("id, vehicle_name, type, plate_number").in("id", vehicleIds)
        : Promise.resolve({ data: [], error: null }),
      driverIds.length > 0
        ? supabase.from("users").select("id, name").in("id", driverIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    const vehiclesMap = new Map((vehiclesResult.data || []).map((v: any) => [v.id, v]));
    const driversMap = new Map((driversResult.data || []).map((d: any) => [d.id, d]));

    // Attach vehicle and driver data to requests
    const requestsWithDetails = (requests || []).map((req: any) => ({
      ...req,
      vehicles: vehiclesMap.get(req.assigned_vehicle_id) || null,
      drivers: driversMap.get(req.assigned_driver_id) || null
    }));

    // Group by date and count slots
    const availability: Record<string, {
      total: number;
      available: number;
      pending: number;
      approved: number;
      rejected: number;
      requests: Array<{
        id: string;
        request_number: string;
        title: string;
        status: string;
        requester_name: string;
        department: string;
        vehicle?: string;
        driver?: string;
        destination?: string;
      }>;
    }> = {};

    // Initialize all dates in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      availability[dateISO] = {
        total: 0,
        available: MAX_SLOTS_PER_DAY,
        pending: 0,
        approved: 0,
        rejected: 0,
        requests: []
      };
    }

    // Process requests
    requestsWithDetails.forEach((req: any) => {
      const startDate = new Date(req.travel_start_date);
      const endDate = new Date(req.travel_end_date);
      
      // Get all dates in the travel range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateISO = currentDate.toISOString().split('T')[0];
        
        if (availability[dateISO]) {
          availability[dateISO].total++;
          availability[dateISO].available = Math.max(0, MAX_SLOTS_PER_DAY - availability[dateISO].total);
          
          // Categorize by status
          if (req.status.startsWith("pending_")) {
            availability[dateISO].pending++;
          } else if (req.status === "approved") {
            availability[dateISO].approved++;
          } else if (req.status === "rejected") {
            availability[dateISO].rejected++;
          }

          // Add request details
          availability[dateISO].requests.push({
            id: req.id,
            request_number: req.request_number || "",
            title: req.title || req.purpose || "",
            status: req.status,
            requester_name: req.requester_name || "",
            department: req.departments?.name || req.departments?.code || "",
            vehicle: req.vehicles ? `${req.vehicles.vehicle_name} (${req.vehicles.type}${req.vehicles.plate_number ? ` - ${req.vehicles.plate_number}` : ''})` : undefined,
            driver: req.drivers?.name,
            destination: req.destination || ""
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return NextResponse.json({ 
      ok: true, 
      data: availability,
      maxSlots: MAX_SLOTS_PER_DAY
    });
  } catch (err: any) {
    console.error("[GET /api/schedule/availability] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

