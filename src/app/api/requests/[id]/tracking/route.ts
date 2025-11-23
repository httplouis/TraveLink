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

    // Fetch full user object (for approvers)
    const fetchUserObject = async (userId: string | null) => {
      if (!userId) return null;
      try {
        const { data, error } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id")
        .eq("id", userId)
        .single();
        if (error) {
          console.error('[fetchUserObject] Error:', error);
          return null;
        }
        // Fetch department if exists
        if (data?.department_id) {
          try {
            const { data: dept, error: deptError } = await supabase
              .from("departments")
              .select("id, name, code")
              .eq("id", data.department_id)
              .single();
            if (dept && !deptError) {
              data.department = dept;
            }
          } catch (e) {
            console.warn('[fetchUserObject] Error fetching department:', e);
          }
        }
        return data;
      } catch (err) {
        console.error('[fetchUserObject] Exception:', err);
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
          .select("name, id, full_name, email, phone_number, profile_picture")
        .eq("id", driverId)
        .single();
      
      if (error) {
          console.error('[fetchDriver] Error:', error);
          return null;
        }
        
        return data ? {
          id: data.id,
          name: data.name || data.full_name || 'Unknown Driver',
          full_name: data.name || data.full_name || 'Unknown Driver',
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
          .select("id, name, full_name, email, profile_picture, avatar_url, position_title, phone_number, department_id, departments:department_id(id, name, code), role, is_head")
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
        
      console.log('[Tracking API] Requester data:', {
        id: data?.id,
        name: data?.name,
        full_name: data?.full_name,
        email: data?.email,
        profile_picture: data?.profile_picture,
        avatar_url: data?.avatar_url,
        position_title: data?.position_title,
        role: data?.role,
        is_head: data?.is_head,
        hasProfilePicture: !!data?.profile_picture,
        hasAvatarUrl: !!data?.avatar_url
      });
      return data || null;
      } catch (err) {
        console.error('[fetchRequesterData] Exception:', err);
        return null;
      }
    };

    // Fetch all related data in parallel with error handling
    let requesterData, department, headApproverName, parentHeadApproverName, adminProcessorName;
    let comptrollerApproverName, hrApproverName, vpApproverName, vp2ApproverName, presidentApproverName, execApproverName;
    let rejectedByName, assignedVehicle, assignedDriver, preferredVehicle, preferredDriver;
    
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
      fetchUserName(request.parent_head_approved_by),
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

    // Get head endorsement invitations (for multi-department requests)
    let headEndorsements = [];
    try {
      const { data: headEndorsementInvitations, error: headEndorsementError } = await supabase
        .from("head_endorsement_invitations")
        .select(`
          *,
          head:users!head_user_id(id, name, email, profile_picture),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      
      if (headEndorsementError) {
        console.error('[Tracking API] Error fetching head endorsement invitations:', headEndorsementError);
      } else {
        headEndorsements = (headEndorsementInvitations || []).map((endorsement: any) => ({
          id: endorsement.id,
          request_id: endorsement.request_id,
          head_user_id: endorsement.head_user_id,
          head_email: endorsement.head_email,
          head_name: endorsement.head_name,
          department_id: endorsement.department_id,
          department_name: endorsement.department_name,
          status: endorsement.status,
          signature: endorsement.signature,
          confirmed_at: endorsement.confirmed_at,
          declined_at: endorsement.declined_at,
          declined_reason: endorsement.declined_reason,
          endorsement_date: endorsement.endorsement_date,
          comments: endorsement.comments,
          invited_at: endorsement.invited_at,
          created_at: endorsement.created_at,
          updated_at: endorsement.updated_at,
          head: endorsement.head || (endorsement.head_email ? {
            id: endorsement.head_user_id,
            name: endorsement.head_name,
            email: endorsement.head_email,
            profile_picture: null
          } : null),
          department: endorsement.department || (endorsement.department_name ? {
            id: endorsement.department_id,
            name: endorsement.department_name,
            code: null
          } : null)
        }));
        console.log(`[Tracking API] ✅ Fetched ${headEndorsements.length} head endorsement(s) for request ${requestId}`);
      }
    } catch (err) {
      console.error('[Tracking API] Exception fetching head endorsements:', err);
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
      
      requester: requesterData ? {
        id: requesterData.id,
        name: requesterData.full_name || requesterData.name,
        full_name: requesterData.full_name || requesterData.name,
        email: requesterData.email,
        profile_picture: requesterData.profile_picture || requesterData.avatar_url || null,
        avatar_url: requesterData.avatar_url || requesterData.profile_picture || null,
        position_title: requesterData.position_title,
        phone_number: requesterData.phone_number,
        role: requesterData.role,
        is_head: requesterData.is_head,
        department: requesterData.departments ? (Array.isArray(requesterData.departments) ? requesterData.departments[0] : requesterData.departments) : null
      } : { full_name: requesterName },
      
      // Debug: Log the requester object being returned
      _debug_requester: requesterData ? {
        hasProfilePicture: !!requesterData.profile_picture,
        hasAvatarUrl: !!requesterData.avatar_url,
        profilePictureValue: requesterData.profile_picture,
        avatarUrlValue: requesterData.avatar_url,
        finalProfilePicture: requesterData.profile_picture || requesterData.avatar_url || null,
        finalAvatarUrl: requesterData.avatar_url || requesterData.profile_picture || null
      } : null,
      requester_id: request.requester_id, // Include requester_id at top level for easy access
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
      requires_president_approval: request.requester_is_head || (request.total_budget && parseFloat(request.total_budget) > 50000) || false,
      
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
      admin_approver: request.admin_processed_by ? await fetchUserObject(request.admin_processed_by) : null,
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
      comptroller_approver: request.comptroller_approved_by ? await fetchUserObject(request.comptroller_approved_by) : null,
      comptroller_signature: request.comptroller_signature,
      comptroller_comments: request.comptroller_comments,
      comptroller_edited_budget: request.comptroller_edited_budget,
      
      hr_approved_at: request.hr_approved_at,
      hr_approved_by: hrApproverName,
      hr_approver: request.hr_approved_by ? await fetchUserObject(request.hr_approved_by) : null,
      hr_signature: request.hr_signature,
      hr_comments: request.hr_comments,
      
      vp_approved_at: request.vp_approved_at,
      vp_approved_by: vpApproverName,
      vp_approver: request.vp_approved_by ? await fetchUserObject(request.vp_approved_by) : null,
      vp_signature: request.vp_signature,
      vp_comments: request.vp_comments,
      
      vp2_approved_at: request.vp2_approved_at,
      vp2_approved_by: vp2ApproverName,
      vp2_approver: request.vp2_approved_by ? await fetchUserObject(request.vp2_approved_by) : null,
      vp2_signature: request.vp2_signature,
      vp2_comments: request.vp2_comments,
      both_vps_approved: request.both_vps_approved || false,
      
      president_approved_at: request.president_approved_at,
      president_approved_by: presidentApproverName,
      president_approver: request.president_approved_by ? await fetchUserObject(request.president_approved_by) : null,
      president_signature: request.president_signature,
      president_comments: request.president_comments,
      
      exec_approved_at: request.exec_approved_at,
      exec_approved_by: execApproverName,
      exec_approver: request.exec_approved_by ? await fetchUserObject(request.exec_approved_by) : null,
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
      
      // Seminar data (if seminar application)
      request_type: request.request_type,
      seminar_data: request.seminar_data || null,
      
      // Skip flags for visual indicators
      admin_skipped: request.admin_skipped || false,
      comptroller_skipped: request.comptroller_skipped || false,
      admin_skip_reason: request.admin_skip_reason || null,
      comptroller_skip_reason: request.comptroller_skip_reason || null,
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
