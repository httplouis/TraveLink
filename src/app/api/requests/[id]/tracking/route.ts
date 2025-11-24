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
        .select("id, plate_number, model, vehicle_name")
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
          .select("name, id, name_full, email, phone_number, profile_picture")
        .eq("id", driverId)
        .single();
      
      if (error) {
          console.error('[fetchDriver] Error:', error);
          return null;
        }
        
        return data ? {
          id: data.id,
          name: data.name || data.name_full || 'Unknown Driver',
          full_name: data.name || data.name_full || 'Unknown Driver',
          email: data.email || null,
          phone: data.phone_number || null,
          phone_number: data.phone_number || null,
          profile_picture: data.profile_picture || null
        } : null;
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

    // Fetch head approver full object
    const fetchHeadApprover = async (userId: string | null) => {
      if (!userId) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, full_name, email, profile_picture, position_title, department_id, departments:department_id(id, name, code)")
          .eq("id", userId)
          .single();
        
        if (error) {
          console.error('[fetchHeadApprover] Error:', error);
          return null;
        }
        
        return data ? {
          id: data.id,
          name: data.name || data.full_name || 'Unknown',
          email: data.email || null,
          profile_picture: data.profile_picture || null,
          position_title: data.position_title || 'Department Head',
          department: data.departments || null
        } : null;
      } catch (err) {
        console.error('[fetchHeadApprover] Exception:', err);
        return null;
      }
    };

    // Fetch all related data in parallel with error handling
    let requesterData, department, headApproverName, headApprover, parentHeadApproverName, parentHeadApprover, adminProcessorName;
    let comptrollerApproverName, hrApproverName, vpApproverName, vp2ApproverName, presidentApproverName, execApproverName;
    let rejectedByName, assignedVehicle, assignedDriver, preferredVehicle, preferredDriver;
    
    try {
      [
      requesterData,
      department,
      headApproverName,
      headApprover,
      parentHeadApproverName,
      parentHeadApprover,
      adminProcessorName,
      comptrollerApproverName,
      hrApproverName,
      vpApproverName,
      vp2ApproverName,
      presidentApproverName,
      execApproverName,
      rejectedByName,
      assignedVehicle,
      assignedDriver, // Now returns full driver object, not just name
      preferredVehicle,
      preferredDriver,
      ] = await Promise.allSettled([
      fetchRequesterData(request.requester_id),
      fetchDepartment(request.department_id),
      fetchUserName(request.head_approved_by),
      fetchHeadApprover(request.head_approved_by), // Fetch full head approver object
      fetchUserName(request.parent_head_approved_by),
      fetchHeadApprover(request.parent_head_approved_by), // Fetch full parent head approver object
      fetchUserName(request.admin_processed_by),
      fetchUserName(request.comptroller_approved_by),
      fetchUserName(request.hr_approved_by),
      fetchUserName(request.vp_approved_by),
      fetchUserName(request.vp2_approved_by),
      fetchUserName(request.president_approved_by),
      fetchUserName(request.exec_approved_by),
      fetchUserName(request.rejected_by),
      fetchVehicle(request.assigned_vehicle_id),
      fetchDriver(request.assigned_driver_id), // Use fetchDriver to get full driver object
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
      preferredVehicle: preferredVehicle ? {
        id: preferredVehicle.id,
        name: preferredVehicle.vehicle_name,
        model: preferredVehicle.model,
        plate: preferredVehicle.plate_number
      } : null,
      preferredDriver: preferredDriver ? {
        id: preferredDriver.id,
        name: preferredDriver.name,
        full_name: preferredDriver.full_name
      } : null,
      transportation_type: request.transportation_type
    });
    
    // If preferredDriver is null but preferred_driver_id exists, try to fetch it again
    if (!preferredDriver && request.preferred_driver_id) {
      console.log('[Tracking API] ⚠️ Preferred driver fetch returned null, retrying...');
      try {
        preferredDriver = await fetchDriver(request.preferred_driver_id);
        console.log('[Tracking API] Retry result:', preferredDriver ? {
          id: preferredDriver.id,
          name: preferredDriver.name
        } : 'null');
      } catch (retryErr) {
        console.error('[Tracking API] Retry failed:', retryErr);
      }
    }
    
    // If preferredVehicle is null but preferred_vehicle_id exists, try to fetch it again
    if (!preferredVehicle && request.preferred_vehicle_id) {
      console.log('[Tracking API] ⚠️ Preferred vehicle fetch returned null, retrying...');
      try {
        preferredVehicle = await fetchVehicle(request.preferred_vehicle_id);
        console.log('[Tracking API] Retry result:', preferredVehicle ? {
          id: preferredVehicle.id,
          name: preferredVehicle.vehicle_name,
          plate: preferredVehicle.plate_number
        } : 'null');
      } catch (retryErr) {
        console.error('[Tracking API] Retry failed:', retryErr);
      }
    }

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
    let requesterTracking: any[] = [];
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

    // Get head endorsement invitations (for multi-department requests)
    let headEndorsements: any[] = [];
    try {
      const { data: headEndorsementInvitations, error: headEndorsementError } = await supabase
        .from("head_endorsement_invitations")
        .select(`
          *,
          head:users!head_user_id(id, name, email, profile_picture, position_title, department_id),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .order("confirmed_at", { ascending: true });
      
      if (headEndorsementError) {
        console.error('[Tracking API] Error fetching head endorsement invitations:', headEndorsementError);
      } else {
        headEndorsements = (headEndorsementInvitations || []).map((inv: any) => ({
          id: inv.id,
          head_email: inv.head_email,
          head_name: inv.head_name || inv.head?.name,
          head_user_id: inv.head_user_id,
          department_id: inv.department_id,
          department_name: inv.department_name || inv.department?.name,
          department_code: inv.department?.code,
          status: inv.status,
          invited_at: inv.invited_at,
          confirmed_at: inv.confirmed_at,
          declined_at: inv.declined_at,
          declined_reason: inv.declined_reason,
          endorsement_date: inv.endorsement_date,
          signature: inv.signature,
          comments: inv.comments,
          head: inv.head ? {
            id: inv.head.id,
            name: inv.head.name,
            email: inv.head.email,
            profile_picture: inv.head.profile_picture,
            position_title: inv.head.position_title,
            department: inv.head.department_id ? {
              id: inv.department?.id,
              name: inv.department?.name,
              code: inv.department?.code
            } : null
          } : null
        }));
      }
    } catch (err) {
      console.error('[Tracking API] Exception fetching head endorsement invitations:', err);
      headEndorsements = [];
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
      // Prioritize signature from requests table, then from main requester's invitation, NOT from any confirmed requester
      requester_signature: request.requester_signature || (requesterTracking.find((r: any) => r.status === 'confirmed' && r.user_id === request.requester_id && r.signature)?.signature || null),
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
      vehicle_mode: request.vehicle_mode,
      transportation_type: request.transportation_type,
      pickup_location: request.pickup_location,
      pickup_location_lat: request.pickup_location_lat,
      pickup_location_lng: request.pickup_location_lng,
      pickup_contact_number: request.pickup_contact_number,
      pickup_special_instructions: request.pickup_special_instructions,
      own_vehicle_details: request.own_vehicle_details,
      pickup_time: request.pickup_time,
      return_transportation_same: request.return_transportation_same,
      dropoff_location: request.dropoff_location,
      dropoff_time: request.dropoff_time,
      parking_required: request.parking_required,
      cost_justification: request.cost_justification,
      preferred_vehicle_id: request.preferred_vehicle_id,
      preferred_driver_id: request.preferred_driver_id,
      preferred_vehicle: preferredVehicle ? 
        `${preferredVehicle.model || preferredVehicle.vehicle_name || 'Vehicle'} (${preferredVehicle.plate_number})` : null,
      preferred_vehicle_name: preferredVehicle ? 
        `${preferredVehicle.model || preferredVehicle.vehicle_name || 'Vehicle'} (${preferredVehicle.plate_number})` : null, // Add preferred_vehicle_name
      preferred_driver: preferredDriver ? (preferredDriver.name || preferredDriver.full_name || 'Unknown Driver') : null,
      preferred_driver_name: preferredDriver ? (preferredDriver.name || preferredDriver.full_name || 'Unknown Driver') : (request.preferred_driver_id ? 'Driver preference specified' : null), // Add preferred_driver_name with fallback
      preferred_vehicle_note: request.preferred_vehicle_note,
      preferred_driver_note: request.preferred_driver_note,
      has_parent_head: request.has_parent_head || false,
      requires_president_approval: request.requester_is_head || (request.total_budget && parseFloat(request.total_budget) > 50000) || false,
      
      // Approval chain tracking
      head_approved_at: request.head_approved_at,
      head_approved_by: headApproverName,
      head_approver: headApprover || null, // Add full head approver object
      // Prioritize signature from requests table, fallback to head_endorsement_invitations
      head_signature: request.head_signature || (headEndorsements.find((e: any) => e.status === 'confirmed' && e.signature)?.signature || null),
      head_comments: request.head_comments,
      
      parent_head_approved_at: request.parent_head_approved_at,
      parent_head_approved_by: parentHeadApproverName,
      parent_head_approver: parentHeadApprover || null, // Add full parent head approver object
      // Prioritize signature from requests table, fallback to head_endorsement_invitations
      parent_head_signature: request.parent_head_signature || (headEndorsements.find((e: any) => e.status === 'confirmed' && e.department_id !== request.department_id && e.signature)?.signature || null),
      parent_head_comments: request.parent_head_comments,
      
      admin_processed_at: request.admin_processed_at,
      admin_processed_by: adminProcessorName,
      admin_signature: request.admin_signature,
      admin_comments: request.admin_comments,
      assigned_vehicle: assignedVehicle ? {
        id: request.assigned_vehicle_id,
        name: assignedVehicle.vehicle_name || assignedVehicle.model || 'Vehicle',
        vehicle_name: assignedVehicle.vehicle_name || assignedVehicle.model || 'Vehicle',
        plate_number: assignedVehicle.plate_number || null,
        type: assignedVehicle.type || null,
        capacity: assignedVehicle.capacity || null
      } : null,
      assigned_vehicle_id: request.assigned_vehicle_id,
      assigned_vehicle_name: assignedVehicle ? (assignedVehicle.vehicle_name || assignedVehicle.model || `${assignedVehicle.model || 'Vehicle'} (${assignedVehicle.plate_number || 'N/A'})`) : null,
      assigned_driver: assignedDriver || null,
      assigned_driver_id: request.assigned_driver_id,
      assigned_driver_name: assignedDriver ? (assignedDriver.name || assignedDriver.full_name) : null,
      
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
      
      vp2_approved_at: request.vp2_approved_at,
      vp2_approved_by: vp2ApproverName,
      vp2_signature: request.vp2_signature,
      vp2_comments: request.vp2_comments,
      // Calculate both_vps_approved based on logic:
      // 1. If requester is head → Skip VP2 (both_vps_approved = true)
      // 2. If all requesters are from same department → Skip VP2 (both_vps_approved = true)
      // 3. Only if multiple departments AND requester is not head → Need VP2 (both_vps_approved = false)
      both_vps_approved: (() => {
        const requesterIsHead = request.requester_is_head || false;
        
        // If requester is head, skip VP2
        if (requesterIsHead) {
          return true;
        }
        
        // Check if all requesters are from the same department
        const allDepartmentIds = [
          request.department_id, // Main requester's department
          ...requesterTracking
            .filter((r: any) => r.status === 'confirmed' && r.department_id)
            .map((r: any) => r.department_id)
        ].filter(Boolean);
        
        const uniqueDepartments = new Set(allDepartmentIds);
        const needsSecondVP = uniqueDepartments.size > 1;
        
        // If all from same department, skip VP2
        return !needsSecondVP;
      })(),
      
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
      
      // Head endorsement invitations (for multi-department requests)
      head_endorsements: headEndorsements || [],
      has_multiple_head_endorsements: (headEndorsements || []).length > 0,
      
      // Seminar data (if seminar application)
      request_type: request.request_type,
      seminar_data: request.seminar_data || null,
      
      // Skip flags for visual indicators
      admin_skipped: request.admin_skipped || false,
      comptroller_skipped: request.comptroller_skipped || false,
      admin_skip_reason: request.admin_skip_reason || null,
      comptroller_skip_reason: request.comptroller_skip_reason || null,
      
      // Attachments
      attachments: (() => {
        // Parse attachments if it's a string (JSONB from database)
        let attachments = request.attachments || [];
        if (typeof attachments === 'string') {
          try {
            attachments = JSON.parse(attachments);
          } catch (e) {
            console.warn('[Tracking API] Failed to parse attachments:', e);
            attachments = [];
          }
        }
        // Ensure it's an array
        return Array.isArray(attachments) ? attachments : [];
      })(),
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
