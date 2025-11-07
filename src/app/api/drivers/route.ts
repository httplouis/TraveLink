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

    // Fetch drivers with their user info from existing schema
    // Try simple query first without join
    const { data: driversData, error: driversError } = await supabase
      .from("drivers")
      .select("*");
    
    console.log("[API /drivers] Drivers table query result:", driversData);
    
    if (driversError) {
      console.error("[API /drivers] Error fetching drivers table:", driversError);
    }

    // Fetch ALL users and filter manually (simplest approach)
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, status, role");
    
    console.log("[API /drivers] All users fetched:", allUsers?.length);
    console.log("[API /drivers] Sample user:", allUsers?.[0]);
    
    if (usersError) {
      console.error("[API /drivers] Error fetching users:", usersError);
    }
    
    // Filter for drivers manually - only check role='driver'
    const finalUsersData = allUsers?.filter((u: any) => {
      const roleStr = u.role ? u.role.toString().trim().toLowerCase() : '';
      const hasDriverRole = roleStr === 'driver';
      
      if (hasDriverRole) {
        console.log(`[API /drivers] Found driver: ${u.name} (${u.email})`);
      }
      
      return hasDriverRole; // Only role check, no email requirement
    }) || [];
    
    console.log("[API /drivers] Filtered driver users:", finalUsersData.length);
    console.log("[API /drivers] Driver users:", finalUsersData);

    // Manual join in code
    const data = driversData?.map((driver: any) => {
      const user = finalUsersData?.find((u: any) => u.id === driver.user_id);
      return {
        ...driver,
        users: user
      };
    }).filter((d: any) => d.users); // Only return drivers with matching users

    const error = driversError || usersError;

    if (error) {
      console.error("Error fetching drivers:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Debug: Log raw data
    console.log("[API /drivers] Raw data from DB:", JSON.stringify(data, null, 2));

    // Transform data to match expected format
    let drivers = data?.map((driver: any) => {
      console.log("[API /drivers] Processing driver:", driver);
      const user = driver.users; // Note: plural 'users' from the join
      return {
        id: user?.id || driver.user_id,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        licenseNumber: driver.license_no,
        licenseExpiry: driver.license_expiry,
        rating: driver.driver_rating,
        isAvailable: user?.status === 'active',
      };
    }) || [];

    console.log("[API /drivers] Transformed drivers:", drivers);

    // Filter by available if requested (client-side filtering)
    if (available === "true") {
      drivers = drivers.filter((d: any) => d.isAvailable);
      console.log("[API /drivers] After filtering:", drivers);
    }

    // Sort by name
    drivers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

    console.log("[API /drivers] Final response:", { ok: true, data: drivers });
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
