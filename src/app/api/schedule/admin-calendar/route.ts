// src/app/api/schedule/admin-calendar/route.ts
/**
 * GET /api/schedule/admin-calendar
 * Get calendar data for admin view with full request details
 * Only shows requests after admin approval and vehicle/driver assignment
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

    // Get all requests for the month that are approved and assigned
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    console.log("[GET /api/schedule/admin-calendar] Fetching requests for:", { month, year, startDate, endDate });
    
    // Fetch requests first
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
        departments:departments!requests_department_id_fkey(id, name, code),
        assigned_vehicle_id,
        assigned_driver_id,
        admin_processed_by,
        admin_processed_at,
        participants,
        total_budget,
        created_at,
        updated_at
      `)
      .gte("travel_start_date", startDate)
      .lte("travel_start_date", endDate)
      .not("admin_processed_by", "is", null) // Admin must have processed
      .not("assigned_vehicle_id", "is", null) // Vehicle must be assigned
      .not("assigned_driver_id", "is", null) // Driver must be assigned
      .not("status", "in", "(rejected,cancelled)") // Exclude rejected/cancelled
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[GET /api/schedule/admin-calendar] Supabase error:", error);
      return NextResponse.json({ 
        ok: false, 
        error: error.message || "Database error",
        details: error 
      }, { status: 500 });
    }

    // Fetch vehicle and driver data separately
    const vehicleIds = [...new Set((requests || []).map((r: any) => r.assigned_vehicle_id).filter(Boolean))];
    const driverIds = [...new Set((requests || []).map((r: any) => r.assigned_driver_id).filter(Boolean))];

    const [vehiclesResult, driversResult] = await Promise.all([
      vehicleIds.length > 0 
        ? supabase.from("vehicles").select("id, vehicle_name, type, plate_number, capacity").in("id", vehicleIds)
        : Promise.resolve({ data: [], error: null }),
      driverIds.length > 0
        ? supabase.from("users").select("id, name, email").in("id", driverIds)
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

    console.log("[GET /api/schedule/admin-calendar] Found requests:", requestsWithDetails?.length || 0);
    
    // If no requests found, return empty calendar (this is OK - just means no approved requests yet)
    if (!requestsWithDetails || requestsWithDetails.length === 0) {
      console.log("[GET /api/schedule/admin-calendar] No requests found - returning empty calendar");
      const emptyCalendar: Record<string, {
        total: number;
        available: number;
        requests: any[];
      }> = {};
      
      // Initialize all dates in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        emptyCalendar[dateISO] = {
          total: 0,
          available: MAX_SLOTS_PER_DAY,
          requests: []
        };
      }
      
      return NextResponse.json({ 
        ok: true, 
        data: emptyCalendar,
        maxSlots: MAX_SLOTS_PER_DAY
      });
    }

    // Group by date with full request details
    const calendarData: Record<string, {
      total: number;
      available: number;
      requests: Array<{
        id: string;
        request_number: string;
        title: string;
        purpose: string;
        destination: string;
        status: string;
        requester_name: string;
        department: string;
        department_id: string;
        vehicle: {
          id: string;
          name: string;
          type: string;
          plate_number: string;
          capacity: number;
        };
        driver: {
          id: string;
          name: string;
          email: string;
        };
        travel_start_date: string;
        travel_end_date: string;
        participants: any;
        total_budget: number;
        created_at: string;
        updated_at: string;
        admin_processed_at: string;
      }>;
    }> = {};

    // Initialize all dates in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      calendarData[dateISO] = {
        total: 0,
        available: MAX_SLOTS_PER_DAY,
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
        
        if (calendarData[dateISO]) {
          calendarData[dateISO].total++;
          calendarData[dateISO].available = Math.max(0, MAX_SLOTS_PER_DAY - calendarData[dateISO].total);
          
          // Add full request details (only add once per request, not per date)
          if (!calendarData[dateISO].requests.find(r => r.id === req.id)) {
            calendarData[dateISO].requests.push({
              id: req.id,
              request_number: req.request_number || "",
              title: req.title || req.purpose || "",
              purpose: req.purpose || "",
              destination: req.destination || "",
              status: req.status,
              requester_name: req.requester_name || "",
              department: req.departments?.name || req.departments?.code || "",
              department_id: req.department_id || "",
              vehicle: {
                id: req.assigned_vehicle_id,
                name: req.vehicles?.vehicle_name || "",
                type: req.vehicles?.type || "",
                plate_number: req.vehicles?.plate_number || "",
                capacity: req.vehicles?.capacity || 0
              },
              driver: {
                id: req.assigned_driver_id,
                name: req.drivers?.name || "",
                email: req.drivers?.email || ""
              },
              travel_start_date: req.travel_start_date,
              travel_end_date: req.travel_end_date,
              participants: req.participants || [],
              total_budget: req.total_budget || 0,
              created_at: req.created_at,
              updated_at: req.updated_at,
              admin_processed_at: req.admin_processed_at
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log("[GET /api/schedule/admin-calendar] Returning calendar data for", Object.keys(calendarData).length, "dates");
    
    return NextResponse.json({ 
      ok: true, 
      data: calendarData,
      maxSlots: MAX_SLOTS_PER_DAY
    });
  } catch (err: any) {
    console.error("[GET /api/schedule/admin-calendar] Unexpected error:", err);
    console.error("[GET /api/schedule/admin-calendar] Error stack:", err.stack);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

