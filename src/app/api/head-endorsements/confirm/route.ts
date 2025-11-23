// src/app/api/head-endorsements/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getPhilippineTimestamp(): string {
  const now = new Date();
  const phTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return phTime.toISOString();
}

/**
 * GET /api/head-endorsements/confirm/[token]
 * Get invitation details by token (for confirmation page)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Decode token in case it was double-encoded
    const decodedToken = decodeURIComponent(token);
    
    // Fetch invitation with detailed request data
    let { data: invitation, error: inviteError } = await supabase
      .from("head_endorsement_invitations")
      .select(`
        *,
        request:requests!request_id(
          id,
          request_number,
          title,
          purpose,
          destination,
          travel_start_date,
          travel_end_date,
          expense_breakdown,
          total_budget,
          requester:users!requester_id(id, name, email, profile_picture)
        )
      `)
      .eq("token", token)
      .single();

    // If not found, try decoded token
    if (inviteError && inviteError.code === 'PGRST116' && decodedToken !== token) {
      const { data: decodedData, error: decodedError } = await supabase
        .from("head_endorsement_invitations")
        .select(`
          *,
          request:requests!request_id(
            id,
            request_number,
            title,
            purpose,
            destination,
            travel_start_date,
            travel_end_date,
            expense_breakdown,
            total_budget,
            requester:users!requester_id(id, name, email, profile_picture)
          )
        `)
        .eq("token", decodedToken)
        .single();
      
      if (!decodedError && decodedData) {
        invitation = decodedData;
        inviteError = null;
      }
    }

    if (inviteError || !invitation) {
      return NextResponse.json({ ok: false, error: "Invalid invitation" }, { status: 404 });
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000; // 1 minute buffer
    
    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      if (invitation.status === 'pending') {
        await supabase
          .from("head_endorsement_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }
      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    // Fetch additional request details: requesters and participants
    const requestId = invitation.request_id;
    let requesters: any[] = [];
    let participants: any[] = [];
    
    if (requestId) {
      // Fetch requesters from requester_invitations
      const { data: requesterData } = await supabase
        .from("requester_invitations")
        .select(`
          *,
          user:users!user_id(id, name, email, profile_picture, department:departments(id, name, code))
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      
      if (requesterData) {
        requesters = requesterData.map((req: any) => ({
          id: req.id,
          name: req.name || req.user?.name,
          email: req.email || req.user?.email,
          profile_picture: req.user?.profile_picture,
          department: req.user?.department?.name || req.department,
          department_code: req.user?.department?.code,
          status: req.status,
          signature: req.signature,
        }));
      }

      // Fetch participants from participant_invitations
      const { data: participantData } = await supabase
        .from("participant_invitations")
        .select(`
          *,
          user:users!user_id(id, name, email, profile_picture, department:departments(id, name, code))
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      
      if (participantData) {
        participants = participantData.map((part: any) => ({
          id: part.id,
          name: part.name || part.user?.name,
          email: part.email || part.user?.email,
          profile_picture: part.user?.profile_picture,
          department: part.user?.department?.name || part.department,
          department_code: part.user?.department?.code,
          status: part.status,
        }));
      }
    }

    // Filter requesters/participants by the department that needs endorsement
    const departmentId = invitation.department_id;
    const departmentName = invitation.department_name;
    
    const departmentRequesters = requesters.filter((req: any) => {
      // Match by department_id if available, or by department name
      if (departmentId && req.user?.department?.id === departmentId) return true;
      if (departmentName && (
        req.department === departmentName ||
        req.user?.department?.name === departmentName ||
        req.user?.department?.code === departmentName
      )) return true;
      return false;
    });

    const departmentParticipants = participants.filter((part: any) => {
      if (departmentId && part.user?.department?.id === departmentId) return true;
      if (departmentName && (
        part.department === departmentName ||
        part.user?.department?.name === departmentName ||
        part.user?.department?.code === departmentName
      )) return true;
      return false;
    });

    // Parse expense_breakdown if it's a string
    let expenseBreakdown = invitation.request?.expense_breakdown;
    if (typeof expenseBreakdown === 'string') {
      try {
        expenseBreakdown = JSON.parse(expenseBreakdown);
      } catch (e) {
        console.warn("[GET /api/head-endorsements/confirm] Failed to parse expense_breakdown:", e);
        expenseBreakdown = null;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...invitation,
        request: {
          ...invitation.request,
          expense_breakdown: expenseBreakdown,
        },
        department_requesters: departmentRequesters,
        department_participants: departmentParticipants,
        all_requesters: requesters,
        all_participants: participants,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/head-endorsements/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/head-endorsements/confirm
 * Confirm or decline head endorsement invitation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, head_name, endorsement_date, signature, comments, declined_reason } = body;

    console.log("[POST /api/head-endorsements/confirm] 📥 Received request:", {
      hasToken: !!token,
      action,
      hasHeadName: !!head_name,
      hasEndorsementDate: !!endorsement_date,
      hasSignature: !!signature,
      signatureType: typeof signature,
      signatureLength: signature ? signature.length : 0,
      signaturePreview: signature ? signature.substring(0, 50) + "..." : "NULL/UNDEFINED",
    });

    if (!token || !action) {
      return NextResponse.json({ ok: false, error: "Token and action are required" }, { status: 400 });
    }

    if (action !== "confirm" && action !== "decline") {
      return NextResponse.json({ ok: false, error: "Action must be 'confirm' or 'decline'" }, { status: 400 });
    }

    if (action === "confirm" && !head_name?.trim()) {
      return NextResponse.json({ ok: false, error: "Head name is required for confirmation" }, { status: 400 });
    }

    if (action === "decline" && !declined_reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required for declining" }, { status: 400 });
    }

    // Validate signature for confirmation - REQUIRED
    if (action === "confirm" && !signature) {
      console.warn("[POST /api/head-endorsements/confirm] ⚠️ No signature provided in request body - will check user profile");
      // Don't fail yet - we'll try to get saved signature from user profile first
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Decode token
    const decodedToken = decodeURIComponent(token);
    
    console.log("[POST /api/head-endorsements/confirm] 🔍 Looking up invitation:", {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + "...",
      decodedTokenLength: decodedToken.length,
      tokensMatch: token === decodedToken,
    });
    
    // Fetch invitation - try original token first
    let { data: invitation, error: inviteError } = await supabase
      .from("head_endorsement_invitations")
      .select("*")
      .eq("token", token)
      .single();

    // If not found and token was encoded, try decoded version
    if (inviteError && inviteError.code === 'PGRST116' && decodedToken !== token) {
      console.log("[POST /api/head-endorsements/confirm] 🔄 Token not found, trying decoded version...");
      const { data: decodedData, error: decodedError } = await supabase
        .from("head_endorsement_invitations")
        .select("*")
        .eq("token", decodedToken)
        .single();
      
      if (!decodedError && decodedData) {
        invitation = decodedData;
        inviteError = null;
        console.log("[POST /api/head-endorsements/confirm] ✅ Found invitation with decoded token");
      } else {
        console.error("[POST /api/head-endorsements/confirm] ❌ Decoded token also not found:", decodedError?.message);
      }
    }

    if (inviteError || !invitation) {
      console.error("[POST /api/head-endorsements/confirm] ❌ Invitation not found:", {
        errorCode: inviteError?.code,
        errorMessage: inviteError?.message,
        tokenPreview: token.substring(0, 20) + "...",
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid invitation",
        details: inviteError?.message || "Invitation not found"
      }, { status: 404 });
    }

    console.log("[POST /api/head-endorsements/confirm] ✅ Found invitation:", {
      id: invitation.id,
      headEmail: invitation.head_email,
      status: invitation.status,
      requestId: invitation.request_id,
    });

    // Check if already confirmed/declined
    if (invitation.status !== "pending") {
      return NextResponse.json({ 
        ok: false, 
        error: `Invitation has already been ${invitation.status}` 
      }, { status: 400 });
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000;
    
    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      if (invitation.status === 'pending') {
        await supabase
          .from("head_endorsement_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }
      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    const phNow = getPhilippineTimestamp();

    if (action === "confirm") {
      // Check if user exists and has saved signature
      let finalSignature = signature || null;
      let userProfile: any = null;
      
      console.log("[POST /api/head-endorsements/confirm] 🔍 Processing signature:", {
        signatureFromBody: signature ? "EXISTS" : "NULL/UNDEFINED",
        signatureLength: signature ? signature.length : 0,
        headEmail: invitation.head_email,
      });
      
      if (invitation.head_email) {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, signature_url")
          .eq("email", invitation.head_email.toLowerCase())
          .eq("status", "active")
          .maybeSingle();

        if (userError) {
          console.warn("[POST /api/head-endorsements/confirm] ⚠️ Error fetching user:", userError);
        }

        if (user) {
          userProfile = user;
          console.log("[POST /api/head-endorsements/confirm] 👤 User found:", {
            userId: user.id,
            hasSavedSignature: !!user.signature_url,
          });
          
          if (!finalSignature && user.signature_url) {
            finalSignature = user.signature_url;
            console.log("[POST /api/head-endorsements/confirm] ✅ Using saved signature from user profile");
          } else if (!finalSignature) {
            console.warn("[POST /api/head-endorsements/confirm] ⚠️ No signature in request body AND no saved signature in user profile");
          }
        } else {
          console.warn("[POST /api/head-endorsements/confirm] ⚠️ User not found for email:", invitation.head_email);
        }
      }
      
      if (!finalSignature) {
        console.error("[POST /api/head-endorsements/confirm] ❌ CRITICAL: No signature available (neither from body nor from user profile)");
        return NextResponse.json({ 
          ok: false, 
          error: "Digital signature is required to confirm endorsement. Please provide a signature.",
          details: "No signature was provided in the form and no saved signature was found in your profile."
        }, { status: 400 });
      }

      // Set endorsement_date to confirmed_at date if not provided or if provided date is in the future
      // This ensures endorsement_date matches the actual confirmation date
      const phNowDate = new Date(phNow).toISOString().split('T')[0]; // Get date part only
      let finalEndorsementDate = endorsement_date || phNowDate;
      
      // Validate: endorsement_date should not be in the future
      if (endorsement_date && new Date(endorsement_date) > new Date(phNowDate)) {
        console.warn("[POST /api/head-endorsements/confirm] ⚠️ Endorsement date is in the future, using confirmation date instead");
        finalEndorsementDate = phNowDate;
      }

      // Update invitation to confirmed
      console.log("[POST /api/head-endorsements/confirm] 🔄 Updating invitation:", {
        invitationId: invitation.id,
        headEmail: invitation.head_email,
        hasSignature: !!finalSignature,
        signatureLength: finalSignature ? finalSignature.length : 0,
        headName: head_name.trim(),
        endorsementDate: finalEndorsementDate,
        confirmedAt: phNow,
      });

      const { data: updatedInvitation, error: updateError } = await supabase
        .from("head_endorsement_invitations")
        .update({
          status: 'confirmed',
          head_name: head_name.trim(),
          endorsement_date: finalEndorsementDate,
          signature: finalSignature,
          comments: comments?.trim() || null,
          confirmed_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id)
        .select()
        .single();

      if (updateError) {
        console.error("[POST /api/head-endorsements/confirm] ❌ Update error:", updateError);
        console.error("[POST /api/head-endorsements/confirm] ❌ Error details:", JSON.stringify(updateError, null, 2));
        console.error("[POST /api/head-endorsements/confirm] ❌ Invitation ID:", invitation.id);
        console.error("[POST /api/head-endorsements/confirm] ❌ Token used:", token);
        return NextResponse.json({ 
          ok: false, 
          error: "Failed to confirm invitation",
          details: updateError.message 
        }, { status: 500 });
      }

      if (!updatedInvitation) {
        console.error("[POST /api/head-endorsements/confirm] ❌ Update returned no data");
        return NextResponse.json({ 
          ok: false, 
          error: "Update completed but no data returned" 
        }, { status: 500 });
      }

      console.log("[POST /api/head-endorsements/confirm] ✅ Update successful:", {
        invitationId: updatedInvitation.id,
        status: updatedInvitation.status,
        confirmedAt: updatedInvitation.confirmed_at,
        hasSignature: !!updatedInvitation.signature,
        signatureLength: updatedInvitation.signature ? updatedInvitation.signature.length : 0,
      });

      // CRITICAL: Verify signature was actually saved - fetch from database to confirm
      if (action === 'confirm' && finalSignature) {
        // Fetch the invitation again to verify signature was saved
        const { data: verifyInvitation, error: verifyError } = await supabase
          .from("head_endorsement_invitations")
          .select("id, signature, status")
          .eq("id", invitation.id)
          .single();
        
        if (verifyError) {
          console.error("[POST /api/head-endorsements/confirm] ❌ Failed to verify signature:", verifyError);
        } else if (verifyInvitation) {
          if (!verifyInvitation.signature && finalSignature) {
            console.error("[POST /api/head-endorsements/confirm] ❌ CRITICAL: Signature was provided but not saved! Attempting to save again...", {
              invitationId: updatedInvitation.id,
              signatureProvided: !!finalSignature,
              signatureLength: finalSignature.length,
              savedSignature: !!verifyInvitation.signature,
            });
            
            // Try to update signature again
            const { data: retryUpdate, error: retryError } = await supabase
              .from("head_endorsement_invitations")
              .update({
                signature: finalSignature,
                updated_at: phNow,
              })
              .eq("id", invitation.id)
              .select("signature")
              .single();
            
            if (retryError) {
              console.error("[POST /api/head-endorsements/confirm] ❌ Failed to save signature on retry:", retryError);
            } else if (retryUpdate?.signature) {
              console.log("[POST /api/head-endorsements/confirm] ✅ Signature saved on retry");
              updatedInvitation.signature = retryUpdate.signature;
            } else {
              console.error("[POST /api/head-endorsements/confirm] ❌ Signature still not saved after retry");
            }
          } else if (verifyInvitation.signature) {
            console.log("[POST /api/head-endorsements/confirm] ✅ Signature verified in database:", {
              signatureLength: verifyInvitation.signature.length,
              signaturePreview: verifyInvitation.signature.substring(0, 50) + "...",
            });
            // Update the response with verified signature
            updatedInvitation.signature = verifyInvitation.signature;
          }
        }
      }

      // Update head_user_id if user exists
      if (userProfile && userProfile.id) {
        await supabase
          .from("head_endorsement_invitations")
          .update({ head_user_id: userProfile.id })
          .eq("id", invitation.id);
      }

      // CRITICAL: Sync signature to main requests table
      if (finalSignature && invitation.request_id) {
        const { data: request } = await supabase
          .from("requests")
          .select("head_signature, parent_head_signature, department_id, requester_id, requester_signature")
          .eq("id", invitation.request_id)
          .single();

        if (request) {
          // Check if head is also the requester
          let headIsRequester = false;
          if (invitation.head_email && request.requester_id) {
            // Fetch requester details to compare
            const { data: requester } = await supabase
              .from("users")
              .select("id, email")
              .eq("id", request.requester_id)
              .single();
            
            if (requester) {
              // Compare by email (case-insensitive)
              const headEmail = invitation.head_email.toLowerCase().trim();
              const requesterEmail = requester.email?.toLowerCase().trim();
              headIsRequester = headEmail === requesterEmail;
              
              // Also check by user_id if available
              if (!headIsRequester && userProfile && userProfile.id === request.requester_id) {
                headIsRequester = true;
              }
              
              console.log("[POST /api/head-endorsements/confirm] 🔍 Checking if head is requester:", {
                headEmail,
                requesterEmail,
                headUserId: userProfile?.id,
                requesterId: request.requester_id,
                headIsRequester,
              });
            }
          }
          
          // Determine if this is the primary head or parent head based on department
          const isPrimaryHead = invitation.department_id === request.department_id;
          
          const updateData: any = { updated_at: phNow };
          
          if (isPrimaryHead) {
            // Primary department head
            updateData.head_signature = finalSignature;
            console.log("[POST /api/head-endorsements/confirm] ✅ Syncing to head_signature (primary)");
          } else {
            // Parent department head
            updateData.parent_head_signature = finalSignature;
            console.log("[POST /api/head-endorsements/confirm] ✅ Syncing to parent_head_signature");
          }
          
          // CRITICAL: If head is also the requester, sync signature to requester_signature
          if (headIsRequester) {
            updateData.requester_signature = finalSignature;
            console.log("[POST /api/head-endorsements/confirm] ✅ Head is also requester - syncing signature to requester_signature");
          }

          const { error: syncError } = await supabase
            .from("requests")
            .update(updateData)
            .eq("id", invitation.request_id);

          if (syncError) {
            console.error("[POST /api/head-endorsements/confirm] ❌ Failed to sync signature to requests table:", syncError);
          } else {
            console.log("[POST /api/head-endorsements/confirm] ✅ Successfully synced signature to requests table");
          }
          
          // Also sync to requester_invitations if head is requester
          if (headIsRequester && userProfile?.id) {
            const { data: requesterInvitations } = await supabase
              .from("requester_invitations")
              .select("id, user_id, status")
              .eq("request_id", invitation.request_id)
              .eq("user_id", userProfile.id)
              .maybeSingle();
            
            if (requesterInvitations && requesterInvitations.status !== 'confirmed') {
              // Update requester invitation with signature and confirm it
              const { error: reqInvError } = await supabase
                .from("requester_invitations")
                .update({
                  signature: finalSignature,
                  status: 'confirmed',
                  confirmed_at: phNow,
                  updated_at: phNow,
                })
                .eq("id", requesterInvitations.id);
              
              if (reqInvError) {
                console.error("[POST /api/head-endorsements/confirm] ❌ Failed to sync signature to requester_invitations:", reqInvError);
              } else {
                console.log("[POST /api/head-endorsements/confirm] ✅ Successfully synced signature to requester_invitations");
              }
            } else if (requesterInvitations && requesterInvitations.status === 'confirmed') {
              // If already confirmed, just update the signature
              const { error: reqInvError } = await supabase
                .from("requester_invitations")
                .update({
                  signature: finalSignature,
                  updated_at: phNow,
                })
                .eq("id", requesterInvitations.id);
              
              if (reqInvError) {
                console.error("[POST /api/head-endorsements/confirm] ❌ Failed to update signature in requester_invitations:", reqInvError);
              } else {
                console.log("[POST /api/head-endorsements/confirm] ✅ Successfully updated signature in requester_invitations");
              }
            }
          }
        }
      }

      // Update request workflow_metadata with endorsement info
      const { data: requestData } = await supabase
        .from("requests")
        .select("workflow_metadata")
        .eq("id", invitation.request_id)
        .single();

      const metadata = requestData?.workflow_metadata || {};
      metadata.department_head_endorsed_by = head_name.trim();
      metadata.department_head_endorsement_date = endorsement_date || new Date().toISOString().split('T')[0];
      metadata.head_endorsement_signature = finalSignature;

      await supabase
        .from("requests")
        .update({ workflow_metadata: metadata })
        .eq("id", invitation.request_id);

      console.log("[POST /api/head-endorsements/confirm] ✅ Confirmation successful:", {
        invitationId: updatedInvitation?.id,
        status: updatedInvitation?.status,
        hasSignature: !!updatedInvitation?.signature,
        headName: updatedInvitation?.head_name,
      });

      return NextResponse.json({
        ok: true,
        message: "Successfully confirmed endorsement",
        data: updatedInvitation
      });
    } else {
      // Decline
      const { error: updateError } = await supabase
        .from("head_endorsement_invitations")
        .update({
          status: 'declined',
          declined_reason: declined_reason.trim(),
          declined_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[POST /api/head-endorsements/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to decline invitation" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Endorsement declined",
        data: { ...invitation, status: 'declined' }
      });
    }
  } catch (err: any) {
    console.error("[POST /api/head-endorsements/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

