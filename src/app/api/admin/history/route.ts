// src/app/api/admin/history/route.ts
/**
 * GET /api/admin/history
 * Fetch completed requests and completed maintenance records for history page
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // 'requests' | 'maintenance' | 'all'
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const results: any[] = [];

    // Fetch completed requests (fetch all, then filter and paginate)
    if (!type || type === "all" || type === "requests") {
      let requestsQuery = supabase
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
          requester_name,
          requester_id,
          department_id,
          assigned_vehicle_id,
          assigned_driver_id,
          created_at,
          updated_at,
          departments:departments!requests_department_id_fkey(name, code)
        `)
        .in("status", ["completed", "approved"])
        .order("travel_end_date", { ascending: false });

      if (from) {
        requestsQuery = requestsQuery.gte("travel_start_date", from);
      }

      if (to) {
        requestsQuery = requestsQuery.lte("travel_end_date", to);
      }

      const { data: requests, error: requestsError } = await requestsQuery;

      if (requestsError) {
        console.error("[GET /api/admin/history] Requests error:", requestsError);
      } else {
        // Filter by search and department in memory
        let filteredRequests = (requests || []).filter((req: any) => {
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch =
              req.request_number?.toLowerCase().includes(searchLower) ||
              req.purpose?.toLowerCase().includes(searchLower) ||
              req.destination?.toLowerCase().includes(searchLower) ||
              req.requester_name?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }

          if (department && department !== "") {
            const deptName = req.departments?.name?.toLowerCase() || "";
            const deptCode = req.departments?.code?.toLowerCase() || "";
            const filterLower = department.toLowerCase();
            if (!deptName.includes(filterLower) && !deptCode.includes(filterLower)) {
              return false;
            }
          }

          return true;
        });

        // Fetch vehicle and driver data separately
        const vehicleIds = [...new Set(filteredRequests.map((r: any) => r.assigned_vehicle_id).filter(Boolean))];
        const driverIds = [...new Set(filteredRequests.map((r: any) => r.assigned_driver_id).filter(Boolean))];

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

        // Transform requests to history format
        const requestHistory = filteredRequests.map((req: any) => {
          const vehicle = vehiclesMap.get(req.assigned_vehicle_id);
          const driver = driversMap.get(req.assigned_driver_id);

          return {
            id: req.id,
            type: "request",
            reference: req.request_number || req.id,
            title: req.purpose || req.title || "Travel Request",
            description: req.destination || "",
            department: req.departments?.name || "Unknown Department",
            requester: req.requester_name || "Unknown",
            vehicle: vehicle ? `${vehicle.vehicle_name} (${vehicle.plate_number})` : "N/A",
            driver: driver?.name || "N/A",
            status: req.status === "completed" ? "Completed" : "Approved",
            date: req.travel_end_date || req.travel_start_date || req.created_at,
            created_at: req.created_at,
            updated_at: req.updated_at,
          };
        });

        results.push(...requestHistory);
      }
    }

    // Fetch completed maintenance (fetch all, then filter and paginate)
    if (!type || type === "all" || type === "maintenance") {
      let maintenanceQuery = supabase
        .from("maintenance_records")
        .select(`
          id,
          vehicle_id,
          maintenance_type,
          description,
          cost,
          scheduled_date,
          completed_date,
          status,
          performed_by,
          created_at,
          updated_at,
          vehicles:vehicles!maintenance_records_vehicle_id_fkey(vehicle_name, plate_number, type)
        `)
        .eq("status", "completed")
        .order("completed_date", { ascending: false });

      if (from) {
        maintenanceQuery = maintenanceQuery.gte("completed_date", from);
      }

      if (to) {
        maintenanceQuery = maintenanceQuery.lte("completed_date", to);
      }

      const { data: maintenance, error: maintenanceError } = await maintenanceQuery;

      if (maintenanceError) {
        console.error("[GET /api/admin/history] Maintenance error:", maintenanceError);
      } else {
        // Filter by search in memory
        let filteredMaintenance = (maintenance || []).filter((maint: any) => {
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch =
              maint.description?.toLowerCase().includes(searchLower) ||
              maint.maintenance_type?.toLowerCase().includes(searchLower) ||
              maint.vehicles?.vehicle_name?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }
          return true;
        });

        // Transform maintenance to history format
        const maintenanceHistory = filteredMaintenance.map((maint: any) => {
          const vehicle = maint.vehicles;

          return {
            id: maint.id,
            type: "maintenance",
            reference: `MAINT-${maint.id.slice(0, 8).toUpperCase()}`,
            title: maint.maintenance_type || "Maintenance",
            description: maint.description || "",
            department: "Transport Office",
            requester: maint.performed_by || "System",
            vehicle: vehicle ? `${vehicle.vehicle_name} (${vehicle.plate_number})` : "N/A",
            driver: "N/A",
            status: "Completed",
            cost: maint.cost || 0,
            date: maint.completed_date || maint.scheduled_date || maint.created_at,
            created_at: maint.created_at,
            updated_at: maint.updated_at,
          };
        });

        results.push(...maintenanceHistory);
      }
    }

    // Sort all results by date (most recent first)
    results.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime();
      const dateB = new Date(b.date || b.created_at).getTime();
      return dateB - dateA;
    });

    // Get total count before pagination
    const total = results.length;

    // Apply pagination to combined results
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    const paginatedResults = results.slice(fromIndex, toIndex + 1);

    return NextResponse.json({
      ok: true,
      data: paginatedResults,
      total,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/history] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

