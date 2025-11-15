// src/app/api/participants/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/participants/confirm
 * Confirm or decline participant invitation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await req.json();
    const { token, action, name, department, available_fdp, signature, declined_reason } = body;

    if (!token || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing token or action" },
        { status: 400 }
      );
    }

    if (!['confirm', 'decline'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'confirm' or 'decline'" },
        { status: 400 }
      );
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from("participant_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Invitation already ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("participant_invitations")
        .update({ status: 'expired' })
        .eq("id", invitation.id);

      return NextResponse.json(
        { ok: false, error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Update invitation based on action
    const updateData: any = {
      status: action === 'confirm' ? 'confirmed' : 'declined',
      updated_at: new Date().toISOString(),
    };

    if (action === 'confirm') {
      updateData.confirmed_at = new Date().toISOString();
      
      // Try to find user by email and fetch their profile data
      const { data: userProfile } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          department,
          department_id,
          signature_url,
          avatar_url,
          departments:department_id (
            name
          )
        `)
        .eq("email", invitation.email)
        .single();

      // Auto-populate from user profile if available, but allow manual override
      let autoName = name;
      let autoDepartment = department;
      let autoSignature = signature;

      if (userProfile) {
        updateData.user_id = userProfile.id;
        
        // Auto-populate name if not provided manually
        if (!autoName && userProfile.name) {
          autoName = userProfile.name;
          console.log("[POST /api/participants/confirm] ✅ Auto-populated name from profile:", autoName);
        }
        
        // Auto-populate department if not provided manually
        if (!autoDepartment) {
          // Try department text field first, then department name from join
          autoDepartment = userProfile.department || 
                          (userProfile.departments as any)?.name || 
                          "";
          if (autoDepartment) {
            console.log("[POST /api/participants/confirm] ✅ Auto-populated department from profile:", autoDepartment);
          }
        }
        
        // Auto-populate signature if not provided manually
        if (!autoSignature && userProfile.signature_url) {
          autoSignature = userProfile.signature_url;
          console.log("[POST /api/participants/confirm] ✅ Auto-populated signature from profile");
        }
      }

      // Update invitation with auto-populated or manual data
      if (autoName) updateData.name = autoName;
      if (autoDepartment) updateData.department = autoDepartment;
      if (available_fdp !== undefined) updateData.available_fdp = available_fdp;
      if (autoSignature) updateData.signature = autoSignature;

      // Get request to update applicants array in seminar_data
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .select("id, request_number, title, seminar_data, request_type")
        .eq("id", invitation.request_id)
        .single();

      if (!requestError && request && request.request_type === 'seminar') {
        // Parse seminar_data (JSONB field)
        let seminarData: any = {};
        try {
          if (request.seminar_data && typeof request.seminar_data === 'object') {
            seminarData = request.seminar_data;
          } else if (typeof request.seminar_data === 'string') {
            seminarData = JSON.parse(request.seminar_data);
          }
        } catch (e) {
          console.warn("[POST /api/participants/confirm] Failed to parse seminar_data:", e);
          seminarData = {}; // Initialize empty object if parsing fails
        }

        // Initialize applicants array if it doesn't exist
        if (!Array.isArray(seminarData.applicants)) {
          seminarData.applicants = [];
        }

        // Check if applicant already exists (by email or invitationId)
        const existingIndex = seminarData.applicants.findIndex((app: any) => 
          app.email === invitation.email || 
          app.invitationId === invitation.id ||
          (autoName && app.name?.toLowerCase() === autoName.toLowerCase())
        );

        // Create applicant object matching the form structure
        // Use auto-populated values (from profile) or manual values (from request)
        const applicant = {
          name: autoName || invitation.email,
          department: autoDepartment || "",
          availableFdp: available_fdp ?? null,
          signature: autoSignature || null,
          email: invitation.email,
          invitationId: invitation.id,
          confirmedAt: new Date().toISOString(),
          // Track if data was auto-populated
          autoPopulated: !!userProfile && (!name || !department || !signature),
        };

        if (existingIndex >= 0) {
          // Update existing applicant
          seminarData.applicants[existingIndex] = applicant;
          console.log("[POST /api/participants/confirm] ✅ Updated existing applicant in applicants array");
        } else {
          // Add new applicant
          seminarData.applicants.push(applicant);
          console.log("[POST /api/participants/confirm] ✅ Added new confirmed participant to applicants array");
        }

        // Update request with new applicants array
        const { error: updateRequestError } = await supabase
          .from("requests")
          .update({ seminar_data: seminarData })
          .eq("id", invitation.request_id);

        if (updateRequestError) {
          console.error("[POST /api/participants/confirm] Failed to update request applicants:", updateRequestError);
          // Don't fail the confirmation if this update fails - invitation is still confirmed
        } else {
          console.log("[POST /api/participants/confirm] ✅ Successfully synced confirmed participant to applicants array");
        }
      } else if (request && request.request_type !== 'seminar') {
        console.warn("[POST /api/participants/confirm] Request is not a seminar type, skipping applicants sync");
      }
    } else {
      updateData.declined_at = new Date().toISOString();
      if (declined_reason) updateData.declined_reason = declined_reason;
    }

    const { error: updateError } = await supabase
      .from("participant_invitations")
      .update(updateData)
      .eq("id", invitation.id);

    if (updateError) {
      console.error("[POST /api/participants/confirm] Update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Get request details for notification (refresh if we updated it)
    const { data: request } = await supabase
      .from("requests")
      .select("id, request_number, title")
      .eq("id", invitation.request_id)
      .single();

    // TODO: Send notification to requester about confirmation/decline

    return NextResponse.json({
      ok: true,
      data: {
        invitation_id: invitation.id,
        status: updateData.status,
        request: request,
      },
      message: action === 'confirm' 
        ? "Thank you for confirming your participation!" 
        : "Your response has been recorded.",
    });
  } catch (err: any) {
    console.error("[POST /api/participants/confirm] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/participants/confirm?token=xxx
 * Get invitation details by token
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token parameter" },
        { status: 400 }
      );
    }

    // Get invitation first
    const { data: invitation, error: inviteError } = await supabase
      .from("participant_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError) {
      console.error("[GET /api/participants/confirm] ❌ Database error:", inviteError);
      console.error("[GET /api/participants/confirm] ❌ Token searched:", token);
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation link", details: inviteError.message },
        { status: 404 }
      );
    }

    if (!invitation) {
      console.error("[GET /api/participants/confirm] ❌ No invitation found for token:", token);
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Get request details separately
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        purpose,
        request_type,
        travel_start_date,
        travel_end_date,
        destination,
        seminar_data,
        requester_id
      `)
      .eq("id", invitation.request_id)
      .single();

    if (requestError || !requestData) {
      console.error("[GET /api/participants/confirm] ❌ Request fetch error:", requestError);
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Get requester details
    let requester = null;
    if (requestData.requester_id) {
      const { data: requesterData } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", requestData.requester_id)
        .single();
      requester = requesterData;
    }

    // Combine invitation and request data
    const invitationWithRequest = {
      ...invitation,
      request: {
        ...requestData,
        requester
      }
    };

    // Check if expired
    if (new Date(invitationWithRequest.expires_at) < new Date() && invitationWithRequest.status === 'pending') {
      await supabase
        .from("participant_invitations")
        .update({ status: 'expired' })
        .eq("id", invitationWithRequest.id);

      return NextResponse.json(
        { ok: false, error: "Invitation has expired", expired: true },
        { status: 400 }
      );
    }

    // Extract dates and title from seminar_data if available
    let dateFrom = null;
    let dateTo = null;
    let seminarTitle = null;
    const request = invitationWithRequest?.request as any;
    
    if (request?.seminar_data) {
      const seminarData = typeof request.seminar_data === 'string' 
        ? JSON.parse(request.seminar_data) 
        : request.seminar_data;
      
      console.log("[GET /api/participants/confirm] 📅 Seminar data:", JSON.stringify(seminarData, null, 2));
      
      dateFrom = seminarData?.dateFrom || seminarData?.date_from || null;
      dateTo = seminarData?.dateTo || seminarData?.date_to || null;
      seminarTitle = seminarData?.title || null;
      
      console.log("[GET /api/participants/confirm] 📅 Extracted dates:", { dateFrom, dateTo, seminarTitle });
    }
    
    // Fallback to travel_start_date and travel_end_date
    if (!dateFrom && request?.travel_start_date) {
      dateFrom = new Date(request.travel_start_date).toISOString().split('T')[0];
      console.log("[GET /api/participants/confirm] 📅 Using travel_start_date:", dateFrom);
    }
    if (!dateTo && request?.travel_end_date) {
      dateTo = new Date(request.travel_end_date).toISOString().split('T')[0];
      console.log("[GET /api/participants/confirm] 📅 Using travel_end_date:", dateTo);
    }
    
    // Add extracted dates and title to request object
    if (request) {
      request.date_from = dateFrom;
      request.date_to = dateTo;
      request.seminar_title = seminarTitle || request.title || "Seminar/Training";
      request.seminar_venue = request?.seminar_data?.venue || request.destination || null;
    }

    // Try to find user by email to auto-populate their info
    let userProfile: any = null;
    if (invitationWithRequest.email) {
      const { data: profile } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          department,
          department_id,
          signature_url,
          departments:department_id (
            name
          )
        `)
        .eq("email", invitation.email)
        .single();
      
      if (profile) {
        userProfile = {
          name: profile.name,
          department: profile.department || (profile.departments as any)?.name || "",
          hasSignature: !!profile.signature_url,
          signatureUrl: profile.signature_url,
          isUser: true,
        };
        console.log("[GET /api/participants/confirm] ✅ Found user profile for auto-populate:", profile.email);
      } else {
        console.log("[GET /api/participants/confirm] ℹ️ User not found in system, manual input required:", invitation.email);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...invitation,
        // Include user profile data if found (for auto-population)
        userProfile,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/participants/confirm] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

