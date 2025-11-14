// src/app/api/drivers/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/drivers
 * Fetch all available drivers
 * UPDATED to work with existing schema (drivers table + users table)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role to bypass RLS
    const { searchParams } = new URL(request.url);
    const available = searchParams.get("available"); // Optional filter

    // Fetch users and drivers separately, then join manually (most reliable)
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, phone_number, status, role")
      .eq("role", "driver")
      .order("name", { ascending: true });

    const { data: driversData, error: driversError } = await supabase
      .from("drivers")
      .select("user_id, license_no, license_expiry, driver_rating, phone");

    if (usersError || driversError) {
      console.error("[API /drivers] Error:", usersError || driversError);
      return NextResponse.json(
        { ok: false, error: (usersError || driversError).message },
        { status: 500 }
      );
    }

    console.log("[API /drivers] Users found:", usersData?.length || 0);
    console.log("[API /drivers] Sample user:", usersData?.[0]);
    console.log("[API /drivers] Driver records found:", driversData?.length || 0);
    console.log("[API /drivers] Sample driver record:", driversData?.[0]);

    // Manual join: Map users to drivers
    const driversMap = new Map((driversData || []).map((d: any) => [d.user_id, d]));

    // Transform data to match expected format
    let drivers = (usersData || []).map((user: any) => {
      const driverInfo = driversMap.get(user.id);
      
      // Clean status - remove quotes if present
      const cleanStatus = typeof user.status === 'string' 
        ? user.status.replace(/^'|'$/g, '') 
        : user.status;
      
      const driver = {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: driverInfo?.phone || user.phone_number || '',
        licenseNumber: driverInfo?.license_no || null,
        licenseExpiry: driverInfo?.license_expiry || null,
        rating: driverInfo?.driver_rating ? parseFloat(driverInfo.driver_rating) : null,
        isAvailable: cleanStatus === 'active',
      };
      
      return driver;
    });

    // Filter by available if requested
    if (available === "true") {
      drivers = drivers.filter((d: any) => d.isAvailable);
    }

    console.log("[API /drivers] Returning", drivers.length, "drivers");
    console.log("[API /drivers] Sample driver in response:", drivers[0]);
    console.log("[API /drivers] Full response:", JSON.stringify({ ok: true, data: drivers }, null, 2));
    return NextResponse.json({ ok: true, data: drivers });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/drivers:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drivers
 * Create a new driver (user + driver record)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    const body = await request.json();

    // First, create or find user
    let userId: string;
    
    if (body.userId) {
      // Existing user
      userId = body.userId;
    } else {
      // Create new user
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          name: body.name,
          email: body.email,
          role: "driver",
          department: body.department || "Transport Office",
          status: body.status || "active",
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating user:", userError);
        return NextResponse.json(
          { ok: false, error: userError.message },
          { status: 500 }
        );
      }

      userId = user.id;
    }

    // Now create driver record
    const { data, error } = await supabase
      .from("drivers")
      .insert({
        user_id: userId,
        license_no: body.license_no || body.licenseNumber,
        license_expiry: body.license_expiry || body.licenseExpiry,
        driver_rating: body.driver_rating || body.rating || 5.0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating driver:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/drivers:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drivers
 * Update driver info
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Driver ID is required" },
        { status: 400 }
      );
    }

    // Update driver record
    const dbUpdates: any = {};
    if (updates.license_no || updates.licenseNumber) dbUpdates.license_no = updates.license_no || updates.licenseNumber;
    if (updates.license_expiry || updates.licenseExpiry) dbUpdates.license_expiry = updates.license_expiry || updates.licenseExpiry;
    if (updates.driver_rating !== undefined || updates.rating !== undefined) dbUpdates.driver_rating = updates.driver_rating || updates.rating;

    const { data, error } = await supabase
      .from("drivers")
      .update(dbUpdates)
      .eq("user_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating driver:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Also update user info if provided
    if (updates.name || updates.email || updates.status) {
      const userUpdates: any = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email;
      if (updates.status) userUpdates.status = updates.status;

      await supabase
        .from("users")
        .update(userUpdates)
        .eq("id", id);
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Unexpected error in PATCH /api/drivers:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drivers
 * Delete a driver
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Driver ID is required" },
        { status: 400 }
      );
    }

    // Delete driver record (user remains, just change role or status)
    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("user_id", id);

    if (error) {
      console.error("Error deleting driver:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Optionally update user status or role
    await supabase
      .from("users")
      .update({ status: "inactive" })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Unexpected error in DELETE /api/drivers:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
