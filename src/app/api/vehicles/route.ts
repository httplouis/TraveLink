// src/app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/vehicles
 * Fetch all vehicles with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "available";
    const type = searchParams.get("type"); // Optional filter by type

    let query = supabase
      .from("vehicles")
      .select("*")
      .order("type", { ascending: true })
      .order("vehicle_name", { ascending: true }); // Fixed: use vehicle_name not name

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vehicles:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform to match expected format with consistent naming
    const vehicles = data?.map((v: any) => ({
      id: v.id,
      name: v.vehicle_name,  // Map vehicle_name to name
      plate_number: v.plate_number,
      type: v.type,
      capacity: v.capacity,
      status: v.status,
      notes: v.notes,
    }));

    return NextResponse.json({ ok: true, data: vehicles });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/vehicles:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    const body = await request.json();

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        plate_number: body.plate_number || body.plateNo,
        vehicle_name: body.vehicle_name || body.name,
        type: body.type,
        capacity: body.capacity,
        status: body.status || "available",
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating vehicle:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/vehicles:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vehicles
 * Update an existing vehicle
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Map field names
    const dbUpdates: any = {};
    if (updates.plate_number || updates.plateNo) dbUpdates.plate_number = updates.plate_number || updates.plateNo;
    if (updates.vehicle_name || updates.name) dbUpdates.vehicle_name = updates.vehicle_name || updates.name;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.capacity) dbUpdates.capacity = updates.capacity;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("vehicles")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating vehicle:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Unexpected error in PATCH /api/vehicles:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vehicles
 * Delete a vehicle
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Unexpected error in DELETE /api/vehicles:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
