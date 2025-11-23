// src/app/api/requesters/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * GET /api/requesters/confirm?token=...
 * Fetch invitation details for confirmation
 */
export async function GET(req: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[GET /api/requesters/confirm] 🚀 Route handler called!");
  console.log("=".repeat(70));
  console.log("[GET /api/requesters/confirm] Request URL:", req.url);
  console.log("[GET /api/requesters/confirm] Request method:", req.method);
  
  try {
    // Handle case where req.url might be relative
    let url: URL;
    try {
      url = new URL(req.url);
    } catch (e) {
      // If req.url is relative, construct full URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      url = new URL(req.url, baseUrl);
    }
    
    const { searchParams } = url;
    const token = searchParams.get("token");
    
    console.log("[GET /api/requesters/confirm] Full URL:", url.toString());
    console.log("[GET /api/requesters/confirm] Search params:", Object.fromEntries(searchParams.entries()));

    console.log("[GET /api/requesters/confirm] Request received:", {
      url: req.url,
      pathname: url.pathname,
      token: token ? `${token.substring(0, 8)}...` : "missing",
      tokenLength: token?.length || 0,
    });

    if (!token) {
      console.error("[GET /api/requesters/confirm] ❌ Token missing from request");
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }
    
    // Decode token in case it was double-encoded
    // Try multiple decoding attempts
    let decodedToken = token;
    try {
      decodedToken = decodeURIComponent(token);
      // If decoding changed it, it was encoded
      if (decodedToken === token) {
        // Try decoding again in case it was double-encoded
        const doubleDecoded = decodeURIComponent(decodedToken);
        if (doubleDecoded !== decodedToken) {
          decodedToken = doubleDecoded;
          console.log("[GET /api/requesters/confirm] 🔄 Token was double-encoded, decoded twice");
        }
      } else {
        console.log("[GET /api/requesters/confirm] 🔄 Token was encoded, decoded once");
      }
    } catch (e) {
      // Token might not be encoded, use as-is
      console.log("[GET /api/requesters/confirm] ⚠️ Token decode failed, using as-is:", e);
      decodedToken = token;
    }
    
    console.log("[GET /api/requesters/confirm] 📋 Token analysis:", {
      originalToken: token.substring(0, 16) + "..." + token.substring(token.length - 8),
      originalTokenLength: token.length,
      decodedToken: decodedToken.substring(0, 16) + "..." + decodedToken.substring(decodedToken.length - 8),
      decodedTokenLength: decodedToken.length,
      tokensMatch: token === decodedToken,
      isHex: /^[0-9a-f]+$/i.test(decodedToken),
    });

    // Use direct createClient with service_role to truly bypass RLS
    // createServerClient from @supabase/ssr might still apply RLS even with service_role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[GET /api/requesters/confirm] ❌ Missing Supabase configuration");
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    // Service role client for queries (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    console.log("[GET /api/requesters/confirm] ✅ Using direct createClient with service_role key");
    
    // Fetch invitation - try multiple strategies
    let invitation: any = null;
    let inviteError: any = null;
    
    // Strategy 1: Try with the token as-is
    console.log("[GET /api/requesters/confirm] 🔍 Strategy 1: Searching with token as-is");
    console.log("[GET /api/requesters/confirm] 🔍 Token being searched:", {
      token: token.substring(0, 20) + "..." + token.substring(Math.max(0, token.length - 12)),
      tokenLength: token.length,
      isHex: /^[0-9a-f]+$/i.test(token),
      trimmed: token.trim().length,
    });
    let { data, error } = await supabase
      .from("requester_invitations")
      .select(`
        *,
        request:requests(
          id,
          request_number,
          title,
          purpose,
          destination,
          travel_start_date,
          travel_end_date,
          pickup_location,
          pickup_location_lat,
          pickup_location_lng,
          pickup_time,
          dropoff_location,
          dropoff_time,
          vehicle_mode,
          own_vehicle_details,
          transportation_type,
          return_transportation_same,
          parking_required,
          total_budget,
          expense_breakdown,
          cost_justification,
          preferred_driver_name,
          preferred_vehicle_name,
          preferred_driver_note,
          preferred_vehicle_note,
          pickup_contact_number,
          pickup_special_instructions,
          created_at,
          status,
          requester:users!requester_id(id, name, email, profile_picture, department, position_title)
        )
      `)
      .eq("token", token.trim()) // Trim token in case of whitespace
      .single();
    
    invitation = data;
    inviteError = error;
    
    if (inviteError && inviteError.code === 'PGRST116') {
      console.log("[GET /api/requesters/confirm] ❌ Strategy 1 failed: Token not found");
      
      // Strategy 2: Try with decoded token if different
      if (decodedToken !== token) {
        console.log("[GET /api/requesters/confirm] 🔍 Strategy 2: Trying with decoded token");
        const { data: decodedData, error: decodedError } = await supabase
          .from("requester_invitations")
          .select(`
            *,
            request:requests(
              id,
              request_number,
              title,
              purpose,
              destination,
              travel_start_date,
              travel_end_date,
              pickup_location,
              pickup_location_lat,
              pickup_location_lng,
              pickup_time,
              dropoff_location,
              dropoff_time,
              vehicle_mode,
              own_vehicle_details,
              transportation_type,
              return_transportation_same,
              parking_required,
              total_budget,
              expense_breakdown,
              cost_justification,
              preferred_driver_name,
              preferred_vehicle_name,
              preferred_driver_note,
              preferred_vehicle_note,
              pickup_contact_number,
              pickup_special_instructions,
              created_at,
              status,
              transportation_type,
              requester:users!requester_id(id, name, email, profile_picture)
            )
          `)
          .eq("token", decodedToken)
          .single();
        
        if (!decodedError && decodedData) {
          invitation = decodedData;
          inviteError = null;
          console.log("[GET /api/requesters/confirm] ✅ Strategy 2 succeeded: Found with decoded token");
        } else {
          console.log("[GET /api/requesters/confirm] ❌ Strategy 2 failed:", decodedError?.code, decodedError?.message);
        }
      }
      
      // Strategy 3: Try to find by token substring (in case of truncation)
      if (inviteError && inviteError.code === 'PGRST116') {
        console.log("[GET /api/requesters/confirm] 🔍 Strategy 3: Searching all recent invitations to find matching token");
        const { data: allInvitations, error: allError } = await supabase
          .from("requester_invitations")
          .select("id, email, token, request_id, status, expires_at, created_at")
          .limit(100)
          .order("created_at", { ascending: false });
        
        if (!allError && allInvitations) {
          console.log("[GET /api/requesters/confirm] 📊 Found", allInvitations.length, "total invitations");
          
          // Find exact match - try both original and decoded tokens
          const exactMatch = allInvitations.find((inv: any) => {
            const invToken = inv.token || '';
            return invToken === token || 
                   invToken === decodedToken ||
                   invToken.toLowerCase() === token.toLowerCase() ||
                   invToken.toLowerCase() === decodedToken.toLowerCase();
          });
          
          if (exactMatch) {
            console.log("[GET /api/requesters/confirm] ✅ Strategy 3: Found exact match by token");
            console.log("[GET /api/requesters/confirm] 📋 Match details:", {
              invitationId: exactMatch.id,
              email: exactMatch.email,
              status: exactMatch.status,
              tokenMatch: exactMatch.token === token || exactMatch.token === decodedToken,
              tokenLengths: {
                db: exactMatch.token?.length,
                search: token.length,
                decoded: decodedToken.length,
              },
            });
            
            // Fetch full invitation with relations
            const { data: fullInvitation, error: fullError } = await supabase
              .from("requester_invitations")
              .select(`
                *,
                request:requests(
                  id,
                  request_number,
                  title,
                  purpose,
                  destination,
                  travel_start_date,
                  travel_end_date,
                  pickup_location,
                  pickup_location_lat,
                  pickup_location_lng,
                  pickup_time,
                  dropoff_location,
                  dropoff_time,
                  vehicle_mode,
                  own_vehicle_details,
                  transportation_type,
                  return_transportation_same,
                  parking_required,
                  total_budget,
                  expense_breakdown,
                  cost_justification,
                  preferred_driver_name,
                  preferred_vehicle_name,
                  preferred_driver_note,
                  preferred_vehicle_note,
                  pickup_contact_number,
                  pickup_special_instructions,
                  created_at,
                  status,
                  requester:users!requester_id(id, name, email, profile_picture, department, position_title)
                )
              `)
              .eq("id", exactMatch.id)
              .single();
            
            if (!fullError && fullInvitation) {
              invitation = fullInvitation;
              inviteError = null;
              console.log("[GET /api/requesters/confirm] ✅ Strategy 3 succeeded: Found full invitation");
            } else {
              console.error("[GET /api/requesters/confirm] ❌ Strategy 3: Failed to fetch full invitation:", fullError);
            }
          } else {
            // Log first few tokens for debugging
            console.log("[GET /api/requesters/confirm] 🔍 Sample tokens from database:", 
              allInvitations.slice(0, 10).map((inv: any) => ({
                id: inv.id,
                email: inv.email,
                tokenFirst16: inv.token?.substring(0, 16),
                tokenLast8: inv.token?.substring(inv.token?.length - 8),
                tokenLength: inv.token?.length,
                status: inv.status,
                created_at: inv.created_at,
                tokenMatches: {
                  exact: inv.token === token || inv.token === decodedToken,
                  caseInsensitive: inv.token?.toLowerCase() === token.toLowerCase() || inv.token?.toLowerCase() === decodedToken.toLowerCase(),
                },
              }))
            );
            console.log("[GET /api/requesters/confirm] ❌ Strategy 3: No matching token found in database");
            console.log("[GET /api/requesters/confirm] 🔍 Searching for:", {
              token: token.substring(0, 16) + "..." + token.substring(token.length - 8),
              decodedToken: decodedToken.substring(0, 16) + "..." + decodedToken.substring(decodedToken.length - 8),
            });
          }
        } else {
          console.error("[GET /api/requesters/confirm] ❌ Strategy 3: Failed to fetch invitations:", allError);
        }
      }
    } else if (!inviteError && invitation) {
      console.log("[GET /api/requesters/confirm] ✅ Strategy 1 succeeded: Found invitation");
    }

    if (inviteError) {
      console.error("[GET /api/requesters/confirm] ❌ All search strategies failed. Database error:", {
        code: inviteError.code,
        message: inviteError.message,
        details: inviteError.details,
        hint: inviteError.hint,
        searchedToken: token.substring(0, 16) + "..." + token.substring(token.length - 8),
        searchedTokenLength: token.length,
        decodedToken: decodedToken.substring(0, 16) + "..." + decodedToken.substring(decodedToken.length - 8),
        decodedTokenLength: decodedToken.length,
      });
      
      // Final fallback: Get recent invitations and log them for debugging
      console.log("[GET /api/requesters/confirm] 🔍 Final fallback: Fetching recent invitations for debugging");
      const { data: recentInvitations } = await supabase
        .from("requester_invitations")
        .select("id, email, token, status, created_at, expires_at")
        .limit(20)
        .order("created_at", { ascending: false });
      
      if (recentInvitations && recentInvitations.length > 0) {
        console.log("[GET /api/requesters/confirm] 📊 Recent invitations in database:", 
          recentInvitations.map((inv: any) => ({
            id: inv.id,
            email: inv.email,
            tokenPreview: inv.token ? `${inv.token.substring(0, 16)}...${inv.token.substring(inv.token.length - 8)}` : 'null',
            tokenLength: inv.token?.length || 0,
            status: inv.status,
            created_at: inv.created_at,
            expires_at: inv.expires_at,
            isExpired: inv.expires_at ? new Date(inv.expires_at) < new Date() : false,
          }))
        );
      }
      
      // If it's a "not found" error (PGRST116), provide helpful error message
      if (inviteError.code === 'PGRST116') {
        return NextResponse.json({ 
          ok: false, 
          error: "Invitation not found. The link may be invalid, expired, or the invitation may have been deleted. Please request a new invitation link.",
          details: `Token searched: ${token.substring(0, 16)}...${token.substring(token.length - 8)} (length: ${token.length}). Check server logs for recent invitations.`
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to load invitation",
        details: inviteError.message 
      }, { status: 500 });
    }

    if (!invitation) {
      console.error("[GET /api/requesters/confirm] Invitation not found for token");
      return NextResponse.json({ 
        ok: false, 
        error: "Invitation not found. Please check the link or contact the requester for a new invitation." 
      }, { status: 404 });
    }

    // Check if expired (with 1 minute buffer to account for timezone differences)
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000; // 1 minute buffer
    
    console.log("[GET /api/requesters/confirm] Expiration check:", {
      expires_at: invitation.expires_at,
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: expiresAt.getTime() < (now.getTime() - bufferMs),
      status: invitation.status
    });

    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      // Only update status if still pending
      if (invitation.status === 'pending') {
        await supabase
          .from("requester_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }

      return NextResponse.json({ 
        ok: false, 
        error: "This invitation has expired",
        data: { ...invitation, status: 'expired' }
      }, { status: 400 });
    }

    // Check if user exists in system (by email or user_id)
    let userProfile: any = null;
    if (invitation.email) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, department, department_id, profile_picture, signature")
        .eq("email", invitation.email.toLowerCase())
        .eq("status", "active")
        .maybeSingle();

      if (user) {
        userProfile = {
          isUser: true,
          hasSignature: !!user.signature,
          ...user
        };
      }
    } else if (invitation.user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, department, department_id, profile_picture, signature")
        .eq("id", invitation.user_id)
        .eq("status", "active")
        .maybeSingle();

      if (user) {
        userProfile = {
          isUser: true,
          hasSignature: !!user.signature,
          ...user
        };
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...invitation,
        request: invitation.request,
        userProfile: userProfile || { isUser: false }
      }
    });
  } catch (err: any) {
    console.error("[GET /api/requesters/confirm] Unexpected error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
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

/**
 * POST /api/requesters/confirm
 * Confirm or decline requester invitation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, name, department, department_id, signature, declined_reason } = body;

    if (!token || !action) {
      return NextResponse.json({ ok: false, error: "Token and action are required" }, { status: 400 });
    }

    if (action !== "confirm" && action !== "decline") {
      return NextResponse.json({ ok: false, error: "Action must be 'confirm' or 'decline'" }, { status: 400 });
    }

    if (action === "confirm" && !name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required for confirmation" }, { status: 400 });
    }

    if (action === "decline" && !declined_reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required for declining" }, { status: 400 });
    }

    // Use direct createClient with service_role to truly bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[POST /api/requesters/confirm] ❌ Missing Supabase configuration");
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    // Service role client for queries (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    console.log("[POST /api/requesters/confirm] ✅ Using direct createClient with service_role key");

    // Decode token in case it was double-encoded
    const decodedToken = decodeURIComponent(token);
    
    // Fetch invitation - try both encoded and decoded token
    let invitation: any = null;
    let inviteError: any = null;
    
    // First try with the token as-is
    let { data, error } = await supabase
      .from("requester_invitations")
      .select("*")
      .eq("token", token)
      .single();
    
    invitation = data;
    inviteError = error;
    
    // If not found and token was decoded, try with decoded token
    if (inviteError && inviteError.code === 'PGRST116' && decodedToken !== token) {
      console.log("[POST /api/requesters/confirm] 🔄 Token not found, trying decoded token");
      const { data: decodedData, error: decodedError } = await supabase
        .from("requester_invitations")
        .select("*")
        .eq("token", decodedToken)
        .single();
      
      if (!decodedError && decodedData) {
        invitation = decodedData;
        inviteError = null;
        console.log("[POST /api/requesters/confirm] ✅ Found invitation with decoded token");
      }
    }

    if (inviteError || !invitation) {
      return NextResponse.json({ ok: false, error: "Invalid invitation" }, { status: 404 });
    }

    // Check if already confirmed/declined
    if (invitation.status !== "pending") {
      return NextResponse.json({ 
        ok: false, 
        error: `Invitation has already been ${invitation.status}` 
      }, { status: 400 });
    }

    // Check if expired (with 1 minute buffer to account for timezone differences)
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000; // 1 minute buffer
    
    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      // Only update status if still pending
      if (invitation.status === 'pending') {
        await supabase
          .from("requester_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }

      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    const phNow = getPhilippineTimestamp();

    if (action === "confirm") {
      // Check if user exists and has a saved signature
      let finalSignature = signature || null;
      let userProfile: any = null;
      
      if (invitation.email) {
        const { data: user } = await supabase
          .from("users")
          .select("id, signature")
          .eq("email", invitation.email.toLowerCase())
          .eq("status", "active")
          .maybeSingle();

        if (user) {
          userProfile = user;
          // Use saved signature if no signature was provided
          if (!finalSignature && user.signature) {
            finalSignature = user.signature;
            console.log("[POST /api/requesters/confirm] ✅ Using saved signature from user profile");
          }
        }
      }

      // Update invitation to confirmed
      const { data: updatedInvitation, error: updateError } = await supabase
        .from("requester_invitations")
        .update({
          status: 'confirmed',
          name: name.trim(),
          department: department?.trim() || null,
          department_id: department_id || null,
          signature: finalSignature,
          confirmed_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id)
        .select()
        .single();

      if (updateError) {
        console.error("[POST /api/requesters/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to confirm invitation" }, { status: 500 });
      }

      // Update user_id if user exists in system
      if (userProfile && userProfile.id) {
        await supabase
          .from("requester_invitations")
          .update({ user_id: userProfile.id })
          .eq("id", invitation.id);
      }

      // CRITICAL: Sync signature to main requests table ONLY if this is the primary requester
      // Additional requesters' signatures should stay ONLY in requester_invitations.signature
      if (finalSignature && invitation.request_id) {
        const { data: request } = await supabase
          .from("requests")
          .select("requester_id, requester_signature")
          .eq("id", invitation.request_id)
          .single();

        if (request) {
          // ONLY sync if this is the primary requester (requester_id matches)
          // Do NOT sync for additional requesters - their signatures stay in requester_invitations
          const isPrimaryRequester = userProfile && request.requester_id === userProfile.id;

          if (isPrimaryRequester) {
            const { error: syncError } = await supabase
              .from("requests")
              .update({ 
                requester_signature: finalSignature,
                updated_at: phNow,
              })
              .eq("id", invitation.request_id);

            if (syncError) {
              console.error("[POST /api/requesters/confirm] ❌ Failed to sync signature to requests table:", syncError);
            } else {
              console.log("[POST /api/requesters/confirm] ✅ Synced signature to requests table (primary requester)");
            }
          } else {
            console.log("[POST /api/requesters/confirm] ⏭️ Skipping signature sync - this is an additional requester, signature stays in requester_invitations");
          }
        }
      }

      // CRITICAL: Verify signature was actually saved - fetch from database to confirm
      let verifiedInvitation = updatedInvitation;
      if (finalSignature) {
        const { data: verifyInvitation, error: verifyError } = await supabase
          .from("requester_invitations")
          .select("id, signature, status, name, department, confirmed_at")
          .eq("id", invitation.id)
          .single();
        
        if (verifyError) {
          console.error("[POST /api/requesters/confirm] ❌ Failed to verify signature:", verifyError);
        } else if (verifyInvitation) {
          if (!verifyInvitation.signature && finalSignature) {
            console.error("[POST /api/requesters/confirm] ❌ CRITICAL: Signature was provided but not saved! Attempting to save again...", {
              invitationId: updatedInvitation?.id,
              signatureProvided: !!finalSignature,
              signatureLength: finalSignature.length,
              savedSignature: !!verifyInvitation.signature,
            });
            
            // Try to update signature again
            const { data: retryUpdate, error: retryError } = await supabase
              .from("requester_invitations")
              .update({
                signature: finalSignature,
                updated_at: phNow,
              })
              .eq("id", invitation.id)
              .select("signature")
              .single();
            
            if (retryError) {
              console.error("[POST /api/requesters/confirm] ❌ Failed to save signature on retry:", retryError);
            } else if (retryUpdate?.signature) {
              console.log("[POST /api/requesters/confirm] ✅ Signature saved on retry");
              verifiedInvitation = { ...updatedInvitation, signature: retryUpdate.signature };
            } else {
              console.error("[POST /api/requesters/confirm] ❌ Signature still not saved after retry");
            }
          } else if (verifyInvitation.signature) {
            console.log("[POST /api/requesters/confirm] ✅ Signature verified in database:", {
              signatureLength: verifyInvitation.signature.length,
              signaturePreview: verifyInvitation.signature.substring(0, 50) + "...",
            });
            // Update the response with verified signature
            verifiedInvitation = { ...updatedInvitation, signature: verifyInvitation.signature };
          }
        }
      }

      console.log("[POST /api/requesters/confirm] ✅ Confirmation successful:", {
        invitationId: verifiedInvitation?.id,
        status: verifiedInvitation?.status,
        hasSignature: !!verifiedInvitation?.signature,
        signatureLength: verifiedInvitation?.signature?.length || 0,
        name: verifiedInvitation?.name,
      });

      return NextResponse.json({
        ok: true,
        message: "Successfully confirmed participation",
        data: verifiedInvitation || { ...invitation, status: 'confirmed', signature: finalSignature }
      });
    } else {
      // Decline
      const { error: updateError } = await supabase
        .from("requester_invitations")
        .update({
          status: 'declined',
          declined_reason: declined_reason.trim(),
          declined_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[POST /api/requesters/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to decline invitation" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Invitation declined",
        data: { ...invitation, status: 'declined' }
      });
    }
  } catch (err: any) {
    console.error("[POST /api/requesters/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

