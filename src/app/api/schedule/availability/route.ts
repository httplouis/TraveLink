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
        vehicles:vehicles!assigned_vehicle_id(vehicle_name, type, plate_number),
        drivers:users!assigned_driver_id(name)
      `)
      .gte("travel_start_date", startDate)
      .lte("travel_start_date", endDate)
      .in("status", [
        "pending_head",
        "pending_admin",
        "pending_comptroller",
        "pending_hr",
        "pending_exec",
        "approved",
        "rejected"
      ])
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[GET /api/schedule/availability] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

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
    (requests || []).forEach((req: any) => {
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

