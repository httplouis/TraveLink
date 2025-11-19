// src/app/api/schedule/assign/route.ts
/**
 * POST /api/schedule/assign
 * Smart assignment of vehicle and driver to a request
 * Checks availability before assigning
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();

    const { requestId, vehicleId, driverId } = body;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Request ID required" }, { status: 400 });
    }

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

    // Get request details
    const { data: req, error: reqError } = await supabase
      .from("requests")
      .select("travel_start_date, travel_end_date, assigned_vehicle_id, assigned_driver_id")
      .eq("id", requestId)
      .single();

    if (reqError || !req) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    const startDate = new Date(req.travel_start_date);
    const endDate = new Date(req.travel_end_date);

    // Check vehicle availability if provided
    if (vehicleId) {
      const { data: vehicle, error: vehError } = await supabase
        .from("vehicles")
        .select("id, status, plate_number")
        .eq("id", vehicleId)
        .single();

      if (vehError || !vehicle) {
        return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });
      }

      if (vehicle.status !== 'available') {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is not available (status: ${vehicle.status})` 
        }, { status: 400 });
      }

      // Check if vehicle is already assigned during this period
      const { data: conflictingRequests } = await supabase
        .from("requests")
        .select("id")
        .eq("assigned_vehicle_id", vehicleId)
        .neq("id", requestId)
        .in("status", ["approved", "pending_admin", "pending_hr", "pending_exec"])
        .or(`travel_start_date.lte.${endDate.toISOString()},travel_end_date.gte.${startDate.toISOString()}`);

      if (conflictingRequests && conflictingRequests.length > 0) {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is already assigned during this period` 
        }, { status: 400 });
      }

      // Check coding days
      const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      const { data: codingDay } = await supabase
        .from("vehicle_coding_days")
        .select("coding_day")
        .eq("vehicle_id", vehicleId)
        .eq("coding_day", dayOfWeek)
        .single();

      if (codingDay) {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is on coding day (${dayOfWeek})` 
        }, { status: 400 });
      }
    }

    // Check driver availability if provided
    if (driverId) {
      // Check if driver is already assigned during this period
      const { data: conflictingRequests } = await supabase
        .from("requests")
        .select("id")
        .eq("assigned_driver_id", driverId)
        .neq("id", requestId)
        .in("status", ["approved", "pending_admin", "pending_hr", "pending_exec"])
        .or(`travel_start_date.lte.${endDate.toISOString()},travel_end_date.gte.${startDate.toISOString()}`);

      if (conflictingRequests && conflictingRequests.length > 0) {
        const { data: driver } = await supabase
          .from("users")
          .select("name")
          .eq("id", driverId)
          .single();

        return NextResponse.json({ 
          ok: false, 
          error: `Driver ${driver?.name || 'Unknown'} is already assigned during this period` 
        }, { status: 400 });
      }
    }

    // Get request details before update (to check if approved and if SMS already sent)
    const { data: requestBeforeUpdate } = await supabase
      .from("requests")
      .select("status, assigned_driver_id, sms_notification_sent, requester_id, requester_name, requester_contact_number, travel_start_date, destination, pickup_location, pickup_time, pickup_preference, request_number")
      .eq("id", requestId)
      .single();

    // Update request
    const updateData: any = {};
    if (vehicleId) updateData.assigned_vehicle_id = vehicleId;
    if (driverId) updateData.assigned_driver_id = driverId;
    if (vehicleId === null) updateData.assigned_vehicle_id = null;
    if (driverId === null) updateData.assigned_driver_id = null;

    const { error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[/api/schedule/assign] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Send SMS to driver if:
    // 1. Request is approved
    // 2. Driver was just assigned (driverId is new)
    // 3. SMS not already sent
    if (driverId && requestBeforeUpdate?.status === "approved" && !requestBeforeUpdate?.sms_notification_sent) {
      try {
        // Fetch driver details
        const { data: driver } = await supabase
          .from("users")
          .select("id, name, phone_number")
          .eq("id", driverId)
          .single();

        // Fetch requester details
        const { data: requester } = await supabase
          .from("users")
          .select("id, name")
          .eq("id", requestBeforeUpdate.requester_id)
          .single();

        if (driver && driver.phone_number && requester) {
          const { sendDriverTravelNotification } = await import("@/lib/sms/sms-service");
          
          const smsResult = await sendDriverTravelNotification({
            driverPhone: driver.phone_number,
            requesterName: requester.name || requestBeforeUpdate.requester_name || "Unknown",
            requesterPhone: requestBeforeUpdate.requester_contact_number || "",
            travelDate: requestBeforeUpdate.travel_start_date,
            destination: requestBeforeUpdate.destination || "",
            pickupLocation: requestBeforeUpdate.pickup_location || undefined,
            pickupTime: requestBeforeUpdate.pickup_time || undefined,
            pickupPreference: requestBeforeUpdate.pickup_preference as 'pickup' | 'self' | 'gymnasium' | undefined,
            requestNumber: requestBeforeUpdate.request_number || "",
          });

          if (smsResult.success) {
            // Update SMS tracking fields
            await supabase
              .from("requests")
              .update({
                sms_notification_sent: true,
                sms_sent_at: new Date().toISOString(),
                driver_contact_number: driver.phone_number,
              })
              .eq("id", requestId);

            console.log(`[/api/schedule/assign] ✅ SMS sent to driver ${driver.name} (${driver.phone_number})`);
          } else {
            console.error(`[/api/schedule/assign] ❌ Failed to send SMS to driver:`, smsResult.error);
          }
        } else if (!driver?.phone_number) {
          console.warn(`[/api/schedule/assign] ⚠️ Driver ${driver?.name || driverId} has no phone number - SMS not sent`);
        }
      } catch (smsError: any) {
        console.error("[/api/schedule/assign] Error sending SMS to driver:", smsError);
        // Don't fail the assignment if SMS fails
      }
    }

    return NextResponse.json({ ok: true, message: "Assignment successful" });
  } catch (err: any) {
    console.error("[/api/schedule/assign] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

