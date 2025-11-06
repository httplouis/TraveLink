// src/app/api/maintenance/route.ts
/**
 * Maintenance Records API - Full CRUD
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/maintenance
 * List maintenance records with filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    const vehicleId = searchParams.get("vehicle_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    let query = supabase
      .from("maintenance_records")
      .select(`
        *,
        vehicle:vehicles(id, vehicle_name, plate_number, type)
      `)
      .order("scheduled_date", { ascending: false })
      .limit(limit);
    
    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[GET /api/maintenance] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[GET /api/maintenance] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/maintenance
 * Create new maintenance record
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    
    const { data, error } = await supabase
      .from("maintenance_records")
      .insert({
        vehicle_id: body.vehicle_id || body.vehicleId,
        maintenance_type: body.maintenance_type || body.type,
        description: body.description,
        cost: body.cost || 0,
        scheduled_date: body.scheduled_date || body.scheduledDate,
        completed_date: body.completed_date || body.completedDate,
        next_service_date: body.next_service_date || body.nextServiceDate,
        performed_by: body.performed_by || body.performedBy,
        approved_by: body.approved_by || body.approvedBy,
        status: body.status || "scheduled",
        priority: body.priority || "normal",
        odometer_reading: body.odometer_reading || body.odometerReading,
        parts_replaced: body.parts_replaced || body.partsReplaced,
        notes: body.notes,
        attachments: body.attachments,
      })
      .select()
      .single();
    
    if (error) {
      console.error("[POST /api/maintenance] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[POST /api/maintenance] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/maintenance
 * Update maintenance record
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID required" }, { status: 400 });
    }
    
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.vehicle_id || updates.vehicleId) dbUpdates.vehicle_id = updates.vehicle_id || updates.vehicleId;
    if (updates.maintenance_type || updates.type) dbUpdates.maintenance_type = updates.maintenance_type || updates.type;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.scheduled_date || updates.scheduledDate) dbUpdates.scheduled_date = updates.scheduled_date || updates.scheduledDate;
    if (updates.completed_date || updates.completedDate) dbUpdates.completed_date = updates.completed_date || updates.completedDate;
    if (updates.next_service_date || updates.nextServiceDate) dbUpdates.next_service_date = updates.next_service_date || updates.nextServiceDate;
    if (updates.performed_by || updates.performedBy) dbUpdates.performed_by = updates.performed_by || updates.performedBy;
    if (updates.approved_by || updates.approvedBy) dbUpdates.approved_by = updates.approved_by || updates.approvedBy;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.odometer_reading || updates.odometerReading) dbUpdates.odometer_reading = updates.odometer_reading || updates.odometerReading;
    if (updates.parts_replaced || updates.partsReplaced) dbUpdates.parts_replaced = updates.parts_replaced || updates.partsReplaced;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.attachments) dbUpdates.attachments = updates.attachments;
    
    const { data, error } = await supabase
      .from("maintenance_records")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("[PATCH /api/maintenance] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[PATCH /api/maintenance] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenance
 * Delete maintenance record
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID required" }, { status: 400 });
    }
    
    const { error } = await supabase
      .from("maintenance_records")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("[DELETE /api/maintenance] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/maintenance] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
