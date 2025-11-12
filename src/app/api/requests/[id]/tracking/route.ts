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
    const { data: request, error } = await supabase
      .from("requests")
      .select(`
        *,
        departments:department_id(id, name, code)
      `)
      .eq("id", requestId)
      .single();
    
    console.log('[Tracking API] Raw request data:', request);

    if (error) {
      console.error("[GET /api/requests/[id]/tracking] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
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
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single();
      return data?.full_name || null;
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
      const { data } = await supabase
        .from("vehicles")
        .select("plate_number, model")
        .eq("id", vehicleId)
        .single();
      return data || null;
    };

    // Fetch requester's user data to get department as fallback
    const fetchRequesterData = async (userId: string | null) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("users")
        .select("full_name, department_id, departments:department_id(id, name, code)")
        .eq("id", userId)
        .single();
      console.log('[Tracking API] Requester data:', data);
      return data || null;
    };

    // Fetch all related data in parallel
    const [
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
    ] = await Promise.all([
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
    ]);

    // Use department from request join, or separate fetch, or requester's department
    let finalDepartment = request.departments || department;
    
    if (!finalDepartment && requesterData?.departments) {
      // If departments is an array, take the first one; otherwise use it directly
      finalDepartment = Array.isArray(requesterData.departments) 
        ? requesterData.departments[0] 
        : requesterData.departments;
    }
    
    const requesterName = requesterData?.full_name || null;
    
    console.log('[Tracking API] Department sources:', {
      from_request_join: request.departments,
      from_separate_fetch: department,
      from_requester: requesterData?.departments,
      final: finalDepartment
    });

    // Get history timeline
    const { data: history } = await supabase
      .from("request_history")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

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
      cost_justification: request.cost_justification,
      preferred_vehicle_id: request.preferred_vehicle_id,
      preferred_driver_id: request.preferred_driver_id,
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
    };

    return NextResponse.json({ ok: true, data: trackingData });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/tracking] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
