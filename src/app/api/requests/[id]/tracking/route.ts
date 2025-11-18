import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const supabase = await createSupabaseServerClient(true);

    // Get full request details with all approval information AND department
    // Try with join first, if it fails, fetch without join
    let request, requestError;
    const { data: requestWithJoin, error: joinError } = await supabase
      .from("requests")
      .select(`
        *,
        departments:department_id(id, name, code)
      `)
      .eq("id", requestId)
      .single();
    
    if (joinError) {
      console.warn('[Tracking API] Join query failed, trying without join:', joinError);
      // Try without join
      const { data: requestNoJoin, error: noJoinError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      if (noJoinError) {
        console.error("[GET /api/requests/[id]/tracking] Error:", noJoinError);
        return NextResponse.json(
          { ok: false, error: noJoinError.message || "Request not found" },
          { status: noJoinError.code === 'PGRST116' ? 404 : 500 }
        );
      }
      
      request = requestNoJoin;
      requestError = null;
    } else {
      request = requestWithJoin;
      requestError = null;
    }
    
    console.log('[Tracking API] Raw request data:', request);

    if (requestError) {
      console.error("[GET /api/requests/[id]/tracking] Error:", requestError);
      return NextResponse.json(
        { ok: false, error: requestError.message },
        { status: 500 }
      );
    }

    if (!request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Debug: Log approval timestamps and request info
    console.log("[Tracking Debug] Request info:", {
      request_number: request.request_number,
      requester_id: request.requester_id,
      department_id: request.department_id,
      hr_approved_at: request.hr_approved_at,
      vp_approved_at: request.vp_approved_at,
      president_approved_at: request.president_approved_at,
      exec_approved_at: request.exec_approved_at,
    });

    // Fetch related data separately to avoid schema cache issues
    const fetchUserName = async (userId: string | null) => {
      if (!userId) return null;
      try {
        const { data, error } = await supabase
        .from("users")
          .select("name, full_name")
        .eq("id", userId)
        .single();
        if (error) {
          console.error('[fetchUserName] Error:', error);
          return null;
        }
        return data?.name || data?.full_name || null;
      } catch (err) {
        console.error('[fetchUserName] Exception:', err);
        return null;
      }
    };

    const fetchDepartment = async (deptId: string | null) => {
      if (!deptId) {
        console.log('[Tracking API] No department ID provided');
        return null;
      }
      console.log('[Tracking API] Fetching department:', deptId);
      const { data, error } = await supabase
        .from("departments")
        .select("name, code")
        .eq("id", deptId)
        .single();
      
      if (error) {
        console.error('[Tracking API] Error fetching department:', error);
      }
      console.log('[Tracking API] Department data:', data);
      return data || null;
    };

    const fetchVehicle = async (vehicleId: string | null) => {
      if (!vehicleId) return null;
      const { data, error } = await supabase
        .from("vehicles")
        .select("plate_number, model, vehicle_name")
        .eq("id", vehicleId)
        .single();
      
      if (error) {
        console.log('[fetchVehicle] Error:', error);
        return null;
      }
      
      return data || null;
    };

    const fetchDriver = async (driverId: string | null) => {
      if (!driverId) return null;
      try {
      // Driver data is in users table, not drivers table
      const { data, error } = await supabase
        .from("users")
          .select("name, id, full_name")
        .eq("id", driverId)
        .single();
      
      if (error) {
          console.error('[fetchDriver] Error:', error);
          return null;
        }
        
        return data ? { full_name: data.name || data.full_name || 'Unknown Driver' } : null;
      } catch (err) {
        console.error('[fetchDriver] Exception:', err);
        return null;
      }
    };

    // Fetch requester's user data to get department as fallback
    const fetchRequesterData = async (userId: string | null) => {
      if (!userId) return null;
      try {
        const { data, error } = await supabase
        .from("users")
          .select("name, full_name, department_id, departments:department_id(id, name, code)")
        .eq("id", userId)
        .single();
        
        if (error) {
          console.error('[fetchRequesterData] Error:', error);
          return null;
        }
        
        // Normalize name field
        if (data && !data.full_name && data.name) {
          data.full_name = data.name;
        }
        
      console.log('[Tracking API] Requester data:', data);
      return data || null;
      } catch (err) {
        console.error('[fetchRequesterData] Exception:', err);
        return null;
      }
    };

    // Fetch all related data in parallel with error handling
    let requesterData, department, headApproverName, parentHeadApproverName, adminProcessorName;
    let comptrollerApproverName, hrApproverName, vpApproverName, presidentApproverName, execApproverName;
    let rejectedByName, assignedVehicle, assignedDriverName, preferredVehicle, preferredDriver;
    
    try {
      [
      requesterData,
      department,
      headApproverName,
      parentHeadApproverName,
      adminProcessorName,
      comptrollerApproverName,
      hrApproverName,
      vpApproverName,
      presidentApproverName,
      execApproverName,
      rejectedByName,
      assignedVehicle,
      assignedDriverName,
      preferredVehicle,
      preferredDriver,
      ] = await Promise.allSettled([
      fetchRequesterData(request.requester_id),
      fetchDepartment(request.department_id),
      fetchUserName(request.head_approved_by),
      fetchUserName(request.parent_head_approved_by),
      fetchUserName(request.admin_processed_by),
      fetchUserName(request.comptroller_approved_by),
      fetchUserName(request.hr_approved_by),
      fetchUserName(request.vp_approved_by),
      fetchUserName(request.president_approved_by),
      fetchUserName(request.exec_approved_by),
      fetchUserName(request.rejected_by),
      fetchVehicle(request.assigned_vehicle_id),
      fetchUserName(request.assigned_driver_id),
      fetchVehicle(request.preferred_vehicle_id),
      fetchDriver(request.preferred_driver_id),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));
    } catch (err) {
      console.error('[Tracking API] Error fetching related data:', err);
      // Continue with null values - don't crash
    }

    // Debug vehicle/driver resolution
    console.log('[Tracking API] Vehicle/Driver Resolution:', {
      preferred_vehicle_id: request.preferred_vehicle_id,
      preferred_driver_id: request.preferred_driver_id,
      preferredVehicle,
      preferredDriver,
      transportation_type: request.transportation_type
    });

    // Use department from request join, or separate fetch, or requester's department
    let finalDepartment = request.departments || department;
    
    if (!finalDepartment && requesterData?.departments) {
      // If departments is an array, take the first one; otherwise use it directly
      finalDepartment = Array.isArray(requesterData.departments) 
        ? requesterData.departments[0] 
        : requesterData.departments;
    }
    
    const requesterName = requesterData?.full_name || requesterData?.name || null;
    
    console.log('[Tracking API] Department sources:', {
      from_request_join: request.departments,
      from_separate_fetch: department,
      from_requester: requesterData?.departments,
      final: finalDepartment
    });

    // Get history timeline
    let history = [];
    try {
      const { data: historyData, error: historyError } = await supabase
      .from("request_history")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
      
      if (historyError) {
        console.error('[Tracking API] Error fetching history:', historyError);
      } else {
        history = historyData || [];
      }
    } catch (err) {
      console.error('[Tracking API] Exception fetching history:', err);
      history = [];
    }

    // Get comprehensive requester-level tracking (multiple requesters from different departments)
    let requesterTracking = [];
    try {
      const { data: requesterInvitations, error: requesterError } = await supabase
        .from("requester_invitations")
        .select(`
          *,
          user:users!user_id(id, name, email, department_id),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .order("confirmed_at", { ascending: true });
      
      if (requesterError) {
        console.error('[Tracking API] Error fetching requester invitations:', requesterError);
      } else {
        requesterTracking = (requesterInvitations || []).map((inv: any) => ({
          id: inv.id,
          name: inv.name || inv.user?.name,
          email: inv.email || inv.user?.email,
          department: inv.department || inv.department_id,
          department_name: inv.department?.name || null,
          department_code: inv.department?.code || null,
          status: inv.status,
          invited_at: inv.invited_at,
          confirmed_at: inv.confirmed_at,
          declined_at: inv.declined_at,
          declined_reason: inv.declined_reason,
          signature: inv.signature,
          user_id: inv.user_id,
        }));
      }
    } catch (err) {
      console.error('[Tracking API] Exception fetching requester tracking:', err);
      requesterTracking = [];
    }

    // Build tracking data
    const trackingData = {
      request_number: request.request_number,
      title: request.title,
      status: request.status,
      created_at: request.created_at,
      
      // Request details
      purpose: request.purpose,
      destination: request.destination,
      travel_start_date: request.travel_start_date,
      travel_end_date: request.travel_end_date,
      
      requester: { full_name: requesterName },
      requester_name: requesterName || request.requester_name,
      requester_signature: request.requester_signature,
      department: finalDepartment,
      department_name: finalDepartment?.name || null,
      department_code: finalDepartment?.code || null,
      
      // DEBUG INFO (remove later)
      _debug: {
        request_dept_id: request.department_id,
        dept_from_join: request.departments,
        dept_from_fetch: department,
        dept_from_requester: requesterData?.departments,
        final_dept: finalDepartment
      },
      requester_is_head: request.requester_is_head,
      has_budget: request.has_budget,
      total_budget: request.total_budget,
      expense_breakdown: request.expense_breakdown,
      transportation_type: request.transportation_type,
      pickup_location: request.pickup_location,
      pickup_time: request.pickup_time,
      cost_justification: request.cost_justification,
      preferred_vehicle_id: request.preferred_vehicle_id,
      preferred_driver_id: request.preferred_driver_id,
      preferred_vehicle: preferredVehicle ? 
        `${preferredVehicle.model || preferredVehicle.vehicle_name || 'Vehicle'} (${preferredVehicle.plate_number})` : null,
      preferred_driver: preferredDriver ? preferredDriver.full_name : null,
      preferred_vehicle_note: request.preferred_vehicle_note,
      preferred_driver_note: request.preferred_driver_note,
      has_parent_head: request.has_parent_head || false,
      
      // Approval chain tracking
      head_approved_at: request.head_approved_at,
      head_approved_by: headApproverName,
      head_signature: request.head_signature,
      head_comments: request.head_comments,
      
      parent_head_approved_at: request.parent_head_approved_at,
      parent_head_approved_by: parentHeadApproverName,
      parent_head_signature: request.parent_head_signature,
      parent_head_comments: request.parent_head_comments,
      
      admin_processed_at: request.admin_processed_at,
      admin_processed_by: adminProcessorName,
      admin_signature: request.admin_signature,
      admin_comments: request.admin_comments,
      assigned_vehicle: assignedVehicle,
      assigned_driver: assignedDriverName ? { full_name: assignedDriverName } : null,
      
      comptroller_approved_at: request.comptroller_approved_at,
      comptroller_approved_by: comptrollerApproverName,
      comptroller_signature: request.comptroller_signature,
      comptroller_comments: request.comptroller_comments,
      comptroller_edited_budget: request.comptroller_edited_budget,
      
      hr_approved_at: request.hr_approved_at,
      hr_approved_by: hrApproverName,
      hr_signature: request.hr_signature,
      hr_comments: request.hr_comments,
      
      vp_approved_at: request.vp_approved_at,
      vp_approved_by: vpApproverName,
      vp_signature: request.vp_signature,
      vp_comments: request.vp_comments,
      
      president_approved_at: request.president_approved_at,
      president_approved_by: presidentApproverName,
      president_signature: request.president_signature,
      president_comments: request.president_comments,
      
      exec_approved_at: request.exec_approved_at,
      exec_approved_by: execApproverName,
      exec_signature: request.exec_signature,
      exec_comments: request.exec_comments,
      
      final_approved_at: request.final_approved_at,
      
      // Rejection info
      rejected_at: request.rejected_at,
      rejected_by: rejectedByName,
      rejection_reason: request.rejection_reason,
      rejection_stage: request.rejection_stage,
      
      // History timeline
      history: history || [],
      
      // Requester-level tracking (multiple requesters from different departments)
      requester_tracking: requesterTracking || [],
      has_multiple_requesters: (requesterTracking || []).length > 0,
      
      // Seminar data (if seminar application)
      request_type: request.request_type,
      seminar_data: request.seminar_data || null,
    };

    // Parse seminar_data if it's a string
    if (trackingData.seminar_data && typeof trackingData.seminar_data === 'string') {
      try {
        trackingData.seminar_data = JSON.parse(trackingData.seminar_data);
      } catch (e) {
        console.warn('[Tracking API] Failed to parse seminar_data:', e);
      }
    }

    return NextResponse.json({ ok: true, data: trackingData });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/tracking] Unexpected error:", err);
    console.error("[GET /api/requests/[id]/tracking] Error stack:", err.stack);
    return NextResponse.json(
      { 
        ok: false, 
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
