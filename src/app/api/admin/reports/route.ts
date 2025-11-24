// src/app/api/admin/reports/route.ts
/**
 * GET /api/admin/reports
 * Fetch all requests for reports/export with full details
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    // Get filter params
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Get request type filter (if provided)
    const requestType = searchParams.get("requestType"); // "travel_order", "seminar", or null for all
    
    // Build query - fetch requests first, then get vehicle and driver data separately
    let query = supabase
      .from("requests")
      .select(`
        id,
        request_number,
        request_type,
        title,
        purpose,
        travel_start_date,
        travel_end_date,
        status,
        department_id,
        assigned_vehicle_id,
        assigned_driver_id,
        total_budget,
        departments:departments!requests_department_id_fkey(id, name, code)
      `, { count: "exact" });
    
    // Filter by request type if specified
    if (requestType && requestType !== "all") {
      query = query.eq("request_type", requestType);
    }
    
    // Apply filters
    if (search) {
      query = query.or(`request_number.ilike.%${search}%,purpose.ilike.%${search}%,title.ilike.%${search}%`);
    }
    
    if (department && department !== "") {
      query = query.eq("departments.name", department);
    }
    
    if (status && status !== "") {
      // Map frontend status to database statuses
      const statusMap: Record<string, string[]> = {
        "Pending": ["pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec", "pending_hr_ack"],
        "Approved": ["approved"],
        "Completed": ["completed"],
        "Rejected": ["rejected", "cancelled"],
      };
      const dbStatuses = statusMap[status] || [status];
      query = query.in("status", dbStatuses);
    }
    
    if (from) {
      query = query.gte("travel_start_date", from);
    }
    
    if (to) {
      query = query.lte("travel_start_date", to);
    }
    
    // Pagination
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    
    query = query
      .order("travel_start_date", { ascending: false })
      .range(fromIndex, toIndex);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error("[GET /api/admin/reports] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    // Fetch vehicle and driver data separately
    const vehicleIds = [...new Set((data || []).map((r: any) => r.assigned_vehicle_id).filter(Boolean))];
    const driverIds = [...new Set((data || []).map((r: any) => r.assigned_driver_id).filter(Boolean))];
    
    const [vehiclesResult, driversResult] = await Promise.all([
      vehicleIds.length > 0 
        ? supabase.from("vehicles").select("id, vehicle_name, plate_number").in("id", vehicleIds)
        : Promise.resolve({ data: [], error: null }),
      driverIds.length > 0
        ? supabase.from("users").select("id, name").in("id", driverIds)
        : Promise.resolve({ data: [], error: null })
    ]);
    
    const vehiclesMap = new Map((vehiclesResult.data || []).map((v: any) => [v.id, v]));
    const driversMap = new Map((driversResult.data || []).map((d: any) => [d.id, d]));
    
    // Transform to TripRow format
    const rows = (data || []).map((req: any) => {
      // Map database status to frontend status
      const mapStatus = (dbStatus: string): string => {
        if (dbStatus.startsWith("pending_")) return "Pending";
        if (dbStatus === "approved") return "Approved";
        if (dbStatus === "completed") return "Completed";
        if (dbStatus === "rejected" || dbStatus === "cancelled") return "Rejected";
        return "Pending";
      };
      
      const vehicle = vehiclesMap.get(req.assigned_vehicle_id);
      const driver = driversMap.get(req.assigned_driver_id);
      
      return {
        id: req.request_number || req.id,
        requestType: req.request_type || "travel_order",
        department: req.departments?.name || "Unknown Department",
        purpose: req.purpose || req.title || "",
        date: req.travel_start_date ? new Date(req.travel_start_date).toISOString().split('T')[0] : "",
        status: mapStatus(req.status) as "Pending" | "Approved" | "Completed" | "Rejected",
        vehicleCode: vehicle?.plate_number || vehicle?.vehicle_name || "N/A",
        driver: driver?.name || "N/A",
        budget: req.total_budget || 0,
        km: 0, // TODO: Add km tracking if available
      };
    });
    
    return NextResponse.json({
      ok: true,
      rows,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/reports] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

