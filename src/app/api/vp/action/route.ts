import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    // Use createSupabaseServerClient for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use direct createClient for service role to truly bypass RLS for queries
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
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

    // Get VP user info
    const { data: vpUser } = await supabase
      .from("users")
      .select("id, name, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!vpUser?.is_vp) {
      return NextResponse.json({ ok: false, error: "VP role required" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes, is_head_request } = body;
    
    console.log(`[VP Action] Received request:`, {
      requestId,
      action,
      hasSignature: !!signature,
      notesLength: notes?.length || 0,
      is_head_request
    });

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // MANDATORY: Notes are required (minimum 10 characters)
    if (action === "approve" && (!notes || notes.trim().length < 10)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Notes are mandatory and must be at least 10 characters long" 
      }, { status: 400 });
    }

    console.log(`[VP Action] ${action} by ${vpUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Get request to check requester type and if other VP has already signed
      console.log(`[VP Action] Fetching request ${requestId}...`);
      console.log(`[VP Action] Using service role client to bypass RLS`);
      
      // First, try to fetch without joins to see if request exists
      const { data: requestCheck, error: checkError } = await supabase
        .from("requests")
        .select("id, status, requester_id, requester_is_head, head_included")
        .eq("id", requestId)
        .maybeSingle();
      
      console.log(`[VP Action] Basic fetch result:`, {
        found: !!requestCheck,
        error: checkError ? {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        } : null
      });
      
      if (checkError) {
        console.error(`[VP Action] Error checking request ${requestId}:`, {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        });
        return NextResponse.json({ 
          ok: false, 
          error: checkError.code === 'PGRST116' ? "Request not found" : `Error fetching request: ${checkError.message}` 
        }, { status: 404 });
      }
      
      if (!requestCheck) {
        console.error(`[VP Action] Request ${requestId} not found in database`);
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }
      
      console.log(`[VP Action] Request found:`, {
        id: requestCheck.id,
        status: requestCheck.status,
        requester_id: requestCheck.requester_id
      });
      
      // Now fetch with joins
      const { data: requestWithJoins, error: requestError } = await supabase
        .from("requests")
        .select(`
          *, 
          requester:users!requester_id(role, is_head, exec_type),
          vp_approver:users!vp_approved_by(id, name, email),
          vp2_approver:users!vp2_approved_by(id, name, email)
        `)
        .eq("id", requestId)
        .single();

      let dbRequest: any = null;
      
      if (requestError) {
        console.error(`[VP Action] Error fetching request with joins ${requestId}:`, requestError);
        // If join fails but request exists, use the basic request data
        if (requestCheck) {
          console.log(`[VP Action] Using basic request data without joins`);
          dbRequest = requestCheck as any;
          dbRequest.requester = null;
          dbRequest.vp_approver = null;
          dbRequest.vp2_approver = null;
          // Continue with basic request data
        } else {
          return NextResponse.json({ 
            ok: false, 
            error: requestError.code === 'PGRST116' ? "Request not found" : `Error fetching request: ${requestError.message}` 
          }, { status: 404 });
        }
      } else {
        // Join succeeded, use the fetched request
        dbRequest = requestWithJoins;
      }

      if (!dbRequest && !requestCheck) {
        console.error(`[VP Action] Request ${requestId} not found in database`);
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }
      
      // Use dbRequest if available, otherwise use requestCheck
      const finalRequest = dbRequest || requestCheck;

      const requester = finalRequest.requester as any;
      const requesterIsHead = finalRequest.requester_is_head || requester?.is_head || false;
      const requesterRole = requester?.role || "faculty";
      const headIncluded = finalRequest.head_included || false;

      // Check workflow_metadata for multiple assigned VPs
      let workflowMetadata: any = finalRequest.workflow_metadata || {};
      const assignedVpIds = Array.isArray(workflowMetadata?.assigned_vp_ids) ? workflowMetadata.assigned_vp_ids : [];
      const vpApprovals = workflowMetadata?.vp_approvals || []; // Track which VPs have approved
      
      // Check if this VP is assigned (for multi-VP system)
      const isAssignedVP = assignedVpIds.length > 0 && assignedVpIds.some((id: any) => String(id) === String(vpUser.id));
      
      // Check if this VP has already approved
      const alreadyApprovedByThisVP = 
        (finalRequest.vp_approved_by === vpUser.id) || 
        (finalRequest.vp2_approved_by === vpUser.id) ||
        (vpApprovals.some((approval: any) => approval.vp_id === vpUser.id));
      
      if (alreadyApprovedByThisVP) {
        return NextResponse.json({ 
          ok: false, 
          error: "You have already approved this request" 
        }, { status: 400 });
      }

      // Check if other VP has already signed
      const otherVPApproved = 
        (finalRequest.vp_approved_by && finalRequest.vp_approved_by !== vpUser.id) ||
        (finalRequest.vp2_approved_by && finalRequest.vp2_approved_by !== vpUser.id);
      
      const isFirstVP = !finalRequest.vp_approved_by;
      const isSecondVP = !isFirstVP && !finalRequest.vp2_approved_by;

      const now = getPhilippineTimestamp();
      const { nextApproverId, nextApproverRole, returnReason } = body; // For choice-based sending

      // Check if there are multiple requesters from different departments (for tracking)
      const { data: requesters } = await supabase
        .from("requester_invitations")
        .select("department_id")
        .eq("request_id", requestId)
        .eq("status", "confirmed");
      
      // Also include the main requester's department
      const allDepartmentIds = [
        finalRequest.department_id, // Main requester's department
        ...(requesters || []).map((r: any) => r.department_id).filter(Boolean)
      ].filter(Boolean);
      
      const uniqueDepartments = new Set(allDepartmentIds);
      const needsSecondVP = uniqueDepartments.size > 1 && !requesterIsHead;
      
      console.log(`[VP Action] Department check:`, {
        requesterIsHead,
        uniqueDepartments: Array.from(uniqueDepartments),
        needsSecondVP,
        allDepartmentIds
      });

      let updateData: any = {};
      let newStatus: string;
      let finalNextApproverRole: string;
      let message: string;

      if (isFirstVP) {
        // First VP is signing
        updateData.vp_approved_at = now;
        updateData.vp_approved_by = vpUser.id;
        updateData.vp_signature = signature || null;
        updateData.vp_comments = notes || null;
        
        // Only set both_vps_approved = true if:
        // 1. Requester is head (skip VP2, go to President)
        // 2. All requesters are from same department (skip VP2)
        // Otherwise, wait for second VP if multiple departments
        if (requesterIsHead || !needsSecondVP) {
          updateData.both_vps_approved = true;
        } else {
          // Multiple departments and requester is not head - need second VP
          updateData.both_vps_approved = false;
        }
        
        // Track VP approval in workflow_metadata for multi-VP system
        // We'll update this later with routing info, but prepare the vp_approvals array
        const updatedWorkflowMetadata = { ...workflowMetadata };
        if (!updatedWorkflowMetadata.vp_approvals) {
          updatedWorkflowMetadata.vp_approvals = [];
        }
        updatedWorkflowMetadata.vp_approvals.push({
          vp_id: vpUser.id,
          vp_name: vpUser.name,
          approved_at: now,
          signature: signature || null,
          comments: notes || null
        });
        // Store temporarily to use later when setting final workflow_metadata
        workflowMetadata = updatedWorkflowMetadata;
        
        // Use selected approver or default logic
        if (returnReason) {
            // Return to requester
            newStatus = "pending_requester";
            finalNextApproverRole = "requester";
            updateData.return_reason = returnReason;
            message = "Request returned to requester for revision.";
          } else if (nextApproverId && nextApproverRole) {
            // User selected specific approver - fetch user's actual role to determine correct status
            try {
              const { data: approverUser } = await supabase
                .from("users")
                .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
                .eq("id", nextApproverId)
                .single();
              
              if (approverUser) {
                // Determine status based on user's actual role
                if (approverUser.is_president || approverUser.exec_type === "president") {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "president";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "VP approved. Request sent to President.";
                } else if (approverUser.is_admin || approverUser.role === "admin") {
                  newStatus = "pending_admin";
                  finalNextApproverRole = "admin";
                  // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                  message = "VP approved. Request sent to Administrators.";
                } else if (approverUser.is_vp || approverUser.role === "exec") {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "vp";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "VP approved. Request sent to another VP.";
                } else if (approverUser.is_hr || approverUser.role === "hr") {
                  newStatus = "pending_hr";
                  finalNextApproverRole = "hr";
                  // Don't set next_hr_id - allow all HRs to see it
                  // updateData.next_hr_id = nextApproverId;
                  message = "VP approved. Request sent to HR.";
                } else if (approverUser.is_comptroller || approverUser.role === "comptroller") {
                  newStatus = "pending_comptroller";
                  finalNextApproverRole = "comptroller";
                  // Don't set next_comptroller_id - allow all comptrollers to see it
                  // updateData.next_comptroller_id = nextApproverId;
                  message = "VP approved. Request sent to Comptroller.";
                } else {
                  // Unknown role - use role from selection or default to president
                  if (nextApproverRole === "president") {
                    newStatus = "pending_exec";
                    finalNextApproverRole = "president";
                    // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                    message = "VP approved. Request sent to President.";
                  } else if (nextApproverRole === "admin") {
                    newStatus = "pending_admin";
                    finalNextApproverRole = "admin";
                    // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                    message = "VP approved. Request sent to Administrators.";
                  } else {
                    // Default to president
                    newStatus = "pending_exec";
                    finalNextApproverRole = "president";
                    // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                    message = "VP approved. Request sent to President.";
                  }
                }
              } else {
                // User not found - use role from selection
                if (nextApproverRole === "president") {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "president";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "VP approved. Request sent to President.";
                } else if (nextApproverRole === "admin") {
                  newStatus = "pending_admin";
                  finalNextApproverRole = "admin";
                  // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                  message = "VP approved. Request sent to Administrators.";
                } else {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "president";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "VP approved. Request sent to President.";
                }
              }
            } catch (err) {
              console.error("[VP Action] Error fetching approver user:", err);
              // Fallback to role-based logic
              if (nextApproverRole === "president") {
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "VP approved. Request sent to President.";
              } else if (nextApproverRole === "admin") {
                newStatus = "pending_admin";
                finalNextApproverRole = "admin";
                // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                message = "VP approved. Request sent to Administrators.";
              } else {
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "VP approved. Request sent to President.";
              }
            }
          } else {
            // Default logic based on requester type and department check
            if (requesterIsHead || requesterRole === "director" || requesterRole === "dean") {
              // Head/Director/Dean requester → Must go to President (skip VP2)
              newStatus = "pending_exec";
              finalNextApproverRole = "president";
              message = "VP approved. Request sent to President.";
            } else if (needsSecondVP) {
              // Multiple departments and requester is not head → Need second VP
              newStatus = "pending_exec";
              finalNextApproverRole = "vp";
              message = "First VP approved. Waiting for second VP approval (multiple departments).";
            } else {
              // Faculty requester (alone or with head) → Check if should go to President or stop at VP
              // Logic: Faculty requests stop at VP unless budget >= 15,000
              // Get budget threshold to determine if should route to President
              const { data: thresholdConfig } = await supabase
                .from("system_config")
                .select("value")
                .eq("key", "faculty_president_threshold")
                .single();
              
              const budgetThreshold = thresholdConfig?.value 
                ? parseFloat(thresholdConfig.value) 
                : 15000.00; // Default: ₱15,000 (faculty requests stop at VP unless budget >= 15k)
              
              const totalBudget = finalRequest.total_budget || 0;
              const exceedsThreshold = totalBudget >= budgetThreshold;
              
              // Check if requester is faculty (not head, not director, not dean)
              const isFacultyRequester = !requesterIsHead && 
                                         requesterRole !== "director" && 
                                         requesterRole !== "dean";
              
              if (isFacultyRequester && exceedsThreshold) {
                // Faculty requester with budget >= threshold → President
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                message = `VP approved. Request sent to President (budget ₱${totalBudget.toFixed(2)} exceeds threshold ₱${budgetThreshold.toFixed(2)}).`;
              } else if (isFacultyRequester && !exceedsThreshold) {
                // Faculty requester with budget < threshold → Fully approved after VP (no President needed)
                newStatus = "approved";
                finalNextApproverRole = "requester";
                updateData.final_approved_at = now;
                message = `Request fully approved by VP (budget ₱${totalBudget.toFixed(2)} is below threshold ₱${budgetThreshold.toFixed(2)}).`;
                
                // Send SMS to driver if assigned and not already sent
                if (finalRequest.assigned_driver_id && !finalRequest.sms_notification_sent) {
                  try {
                    // Fetch driver details
                    const { data: driver } = await supabase
                      .from("users")
                      .select("id, name, phone_number")
                      .eq("id", finalRequest.assigned_driver_id)
                      .single();

                    // Fetch requester details
                    const { data: requester } = await supabase
                      .from("users")
                      .select("id, name")
                      .eq("id", finalRequest.requester_id)
                      .single();

                    if (driver && driver.phone_number && requester) {
                      const { sendDriverTravelNotification } = await import("@/lib/sms/sms-service");
                      
                      const smsResult = await sendDriverTravelNotification({
                        driverPhone: driver.phone_number,
                        requesterName: requester.name || finalRequest.requester_name || "Unknown",
                        requesterPhone: finalRequest.requester_contact_number || "",
                        travelDate: finalRequest.travel_start_date,
                        destination: finalRequest.destination || "",
                        purpose: finalRequest.purpose || "",
                        pickupLocation: finalRequest.pickup_location || undefined,
                        pickupTime: finalRequest.pickup_time || undefined,
                        pickupPreference: finalRequest.pickup_preference as 'pickup' | 'self' | 'gymnasium' | undefined,
                        requestNumber: finalRequest.request_number || "",
                      });

                      if (smsResult.success) {
                        // Update SMS tracking fields
                        updateData.sms_notification_sent = true;
                        updateData.sms_sent_at = now;
                        updateData.driver_contact_number = driver.phone_number;

                        console.log(`[VP Action] ✅ SMS sent to driver ${driver.name} (${driver.phone_number})`);
                      } else {
                        console.error(`[VP Action] ❌ Failed to send SMS to driver:`, smsResult.error);
                      }
                    } else if (!driver?.phone_number) {
                      console.warn(`[VP Action] ⚠️ Driver ${driver?.name || finalRequest.assigned_driver_id} has no phone number - SMS not sent`);
                    }
                  } catch (smsError: any) {
                    console.error("[VP Action] Error sending SMS to driver:", smsError);
                    // Don't fail the approval if SMS fails
                  }
                }
              } else {
                // Fallback: If not faculty requester or other edge cases, default to President
                // This should rarely happen given the structure, but safety fallback
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                message = "VP approved. Request sent to President.";
              }
            }
          }
      } else if (isSecondVP) {
        // Second VP is signing - both VPs have now approved
        // This is just an acknowledgment that both departments' heads have been approved by their respective VPs
        // Request should have already gone through: Head → Admin → Comptroller → HR → VP
        updateData.vp2_approved_at = now;
        updateData.vp2_approved_by = vpUser.id;
        updateData.vp2_signature = signature || null;
        updateData.vp2_comments = notes || null;
        updateData.both_vps_approved = true;
        
        // Track second VP approval in workflow_metadata for multi-VP system
        const updatedWorkflowMetadata = { ...workflowMetadata };
        if (!updatedWorkflowMetadata.vp_approvals) {
          updatedWorkflowMetadata.vp_approvals = [];
        }
        updatedWorkflowMetadata.vp_approvals.push({
          vp_id: vpUser.id,
          vp_name: vpUser.name,
          approved_at: now,
          signature: signature || null,
          comments: notes || null
        });
        updateData.workflow_metadata = updatedWorkflowMetadata;
        
        // Use selected approver or default to President
        if (returnReason) {
          // Return to requester
          newStatus = "pending_requester";
          finalNextApproverRole = "requester";
          updateData.return_reason = returnReason;
          message = "Request returned to requester for revision.";
        } else if (nextApproverId && nextApproverRole) {
          // User selected specific approver - fetch user's actual role to determine correct status
          try {
            const { data: approverUser } = await supabase
              .from("users")
              .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
              .eq("id", nextApproverId)
              .single();
            
            if (approverUser) {
              // Determine status based on user's actual role
              if (approverUser.is_president || approverUser.exec_type === "president") {
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "Both VPs have approved. Request sent to President.";
              } else if (approverUser.is_admin || approverUser.role === "admin") {
                newStatus = "pending_admin";
                finalNextApproverRole = "admin";
                // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                message = "Both VPs have approved. Request sent to Administrators.";
              } else if (approverUser.is_vp || approverUser.role === "exec") {
                newStatus = "pending_exec";
                finalNextApproverRole = "vp";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "Both VPs have approved. Request sent to another VP.";
              } else if (approverUser.is_hr || approverUser.role === "hr") {
                newStatus = "pending_hr";
                finalNextApproverRole = "hr";
                // Don't set next_hr_id - allow all HRs to see it
                // updateData.next_hr_id = nextApproverId;
                message = "Both VPs have approved. Request sent to HR.";
              } else if (approverUser.is_comptroller || approverUser.role === "comptroller") {
                newStatus = "pending_comptroller";
                finalNextApproverRole = "comptroller";
                // Don't set next_comptroller_id - allow all comptrollers to see it
                // updateData.next_comptroller_id = nextApproverId;
                message = "Both VPs have approved. Request sent to Comptroller.";
              } else {
                // Unknown role - use role from selection or default to president
                if (nextApproverRole === "president") {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "president";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "Both VPs have approved. Request sent to President.";
                } else if (nextApproverRole === "admin") {
                  newStatus = "pending_admin";
                  finalNextApproverRole = "admin";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "Both VPs have approved. Request sent to Administrator.";
                } else {
                  newStatus = "pending_exec";
                  finalNextApproverRole = "president";
                  // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                  message = "Both VPs have approved. Request sent to President.";
                }
              }
            } else {
              // User not found - use role from selection
              if (nextApproverRole === "president") {
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "Both VPs have approved. Request sent to President.";
              } else if (nextApproverRole === "admin") {
                newStatus = "pending_admin";
                finalNextApproverRole = "admin";
                // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
                message = "Both VPs have approved. Request sent to Administrators.";
              } else {
                newStatus = "pending_exec";
                finalNextApproverRole = "president";
                // Store in workflow_metadata, not directly on updateData (column doesn't exist)
                message = "Both VPs have approved. Request sent to President.";
              }
            }
          } catch (err) {
            console.error("[VP Action] Error fetching approver user (second VP):", err);
            // Fallback to role-based logic
            if (nextApproverRole === "president") {
              newStatus = "pending_exec";
              finalNextApproverRole = "president";
              // Store in workflow_metadata, not directly on updateData (column doesn't exist)
              message = "Both VPs have approved. Request sent to President.";
            } else if (nextApproverRole === "admin") {
              newStatus = "pending_admin";
              finalNextApproverRole = "admin";
              // Don't set next_admin_id - allow all admins to see it (both Ma'am Cleofe and Ma'am TM)
              message = "Both VPs have approved. Request sent to Administrators.";
            } else {
              newStatus = "pending_exec";
              finalNextApproverRole = "president";
              // Store in workflow_metadata, not directly on updateData (column doesn't exist)
              message = "Both VPs have approved. Request sent to President.";
            }
          }
        } else {
          // Default to President (both VPs approved means both departments acknowledged)
          newStatus = "pending_exec";
          finalNextApproverRole = "president";
          message = "Both VPs have approved. Request sent to President.";
        }
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: "Both VPs have already approved this request" 
        }, { status: 400 });
      }

      updateData.status = newStatus;
      updateData.current_approver_role = finalNextApproverRole;
      updateData.exec_level = requesterIsHead ? "president" : "vp";
      updateData.updated_at = now;

      // Update workflow_metadata with routing information (preserve vp_approvals if they exist)
      const updatedWorkflowMetadataForRouting = { 
        ...workflowMetadata,
        vp_approvals: workflowMetadata.vp_approvals || [] // Preserve existing VP approvals
      };
      if (finalNextApproverRole) {
        updatedWorkflowMetadataForRouting.next_approver_role = finalNextApproverRole;
        
        // For roles where ALL users in that role should see it (admin, comptroller, hr),
        // DON'T set next_approver_id - this allows all users in that role to see it
        // For roles where a specific user is assigned (president, vp, head), set the ID
        if (finalNextApproverRole === "president") {
          updatedWorkflowMetadataForRouting.next_approver_id = nextApproverId;
          updatedWorkflowMetadataForRouting.next_president_id = nextApproverId;
        } else if (finalNextApproverRole === "admin") {
          // Don't set next_approver_id or next_admin_id - allow all admins to see it
          // Explicitly clear any existing next_approver_id to ensure all admins can see it
          updatedWorkflowMetadataForRouting.next_approver_id = null;
          updatedWorkflowMetadataForRouting.next_admin_id = null;
        } else if (finalNextApproverRole === "vp") {
          updatedWorkflowMetadataForRouting.next_approver_id = nextApproverId;
          updatedWorkflowMetadataForRouting.next_vp_id = nextApproverId;
        } else if (finalNextApproverRole === "hr") {
          // Don't set next_approver_id or next_hr_id - allow all HRs to see it
          // Explicitly clear any existing next_approver_id to ensure all HRs can see it
          updatedWorkflowMetadataForRouting.next_approver_id = null;
          updatedWorkflowMetadataForRouting.next_hr_id = null;
        } else if (finalNextApproverRole === "comptroller") {
          // Don't set next_approver_id or next_comptroller_id - allow all comptrollers to see it
          // Explicitly clear any existing next_approver_id to ensure all comptrollers can see it
          updatedWorkflowMetadataForRouting.next_approver_id = null;
          updatedWorkflowMetadataForRouting.next_comptroller_id = null;
        } else if (finalNextApproverRole === "head") {
          updatedWorkflowMetadataForRouting.next_approver_id = nextApproverId;
          updatedWorkflowMetadataForRouting.next_head_id = nextApproverId;
        } else if (nextApproverId && finalNextApproverRole !== "admin" && finalNextApproverRole !== "comptroller" && finalNextApproverRole !== "hr") {
          // For other roles (not admin/comptroller/hr), set next_approver_id if provided
          updatedWorkflowMetadataForRouting.next_approver_id = nextApproverId;
        }
      }
      if (returnReason) {
        updatedWorkflowMetadataForRouting.return_reason = returnReason;
      }
      updateData.workflow_metadata = updatedWorkflowMetadataForRouting;

      // If fully approved, set final approval timestamp
      if (newStatus === "approved") {
        updateData.final_approved_at = now;
      }

      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      const historyComment = isSecondVP 
        ? `Second VP approved. Both VPs have now approved. ${notes || ''}`
        : isFirstVP && uniqueDepartments.size > 1
        ? `First VP approved. Waiting for second VP. ${notes || ''}`
        : notes || (newStatus === "approved" ? "Approved by VP - Request fully approved" : "Approved by VP, forwarded to President");

      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: finalRequest.status || "pending_exec",
        new_status: newStatus,
        comments: historyComment,
        metadata: {
          signature_at: now,
          signature_time: now,
          receive_time: finalRequest.created_at || now,
          submission_time: finalRequest.created_at || null,
          sent_to: finalNextApproverRole,
          sent_to_id: nextApproverId || null,
          requester_type: requesterIsHead ? "head" : "faculty",
          head_included: headIncluded,
          routing_decision: isSecondVP ? "both_vps_approved_skip_to_president" : (newStatus === "approved" ? "vp_final" : "vp_to_president"),
          is_first_vp: isFirstVP,
          is_second_vp: isSecondVP,
          other_vp_approved: otherVPApproved,
          both_vps_approved: isSecondVP
        }
      });

      // Create notifications
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        
        // Notify requester
        if (finalRequest.requester_id) {
          await createNotification({
            user_id: finalRequest.requester_id,
            notification_type: newStatus === "approved" ? "request_approved" : "request_status_change",
            title: newStatus === "approved" ? "Request Fully Approved" : "Request Approved by VP",
            message: newStatus === "approved" 
              ? `Your travel order request ${finalRequest.request_number || ''} has been fully approved!`
              : `Your travel order request ${finalRequest.request_number || ''} has been approved by VP and is now with President.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: newStatus === "approved" ? "high" : "normal",
          });
        }

        // Notify next approver
        if (nextApproverId) {
          if (finalNextApproverRole === "president") {
            await createNotification({
              user_id: nextApproverId,
              notification_type: "request_pending_signature",
              title: "Request Requires Your Approval",
              message: `A travel order request ${finalRequest.request_number || ''} has been sent to you for final approval.`,
              related_type: "request",
              related_id: requestId,
              action_url: `/president/inbox?view=${requestId}`,
              action_label: "Review Request",
              priority: "high",
            });
          } else if (finalNextApproverRole === "admin") {
            await createNotification({
              user_id: nextApproverId,
              notification_type: "request_pending_signature",
              title: "Request Requires Your Review",
              message: `A travel order request ${finalRequest.request_number || ''} has been sent to you for review.`,
              related_type: "request",
              related_id: requestId,
              action_url: `/admin/requests?view=${requestId}`,
              action_label: "Review Request",
              priority: "normal",
            });
          }
        }
      } catch (notifError: any) {
        console.error("[VP Approve] Failed to create notifications:", notifError);
      }

      console.log(`[VP Approve] ✅ Request ${requestId} ${newStatus === "approved" ? "fully approved" : "approved, sent to President"}`);
      
      return NextResponse.json({
        ok: true,
        message: message,
        data: {
          nextStatus: newStatus,
          nextApproverRole: finalNextApproverRole
        }
      });

    } else if (action === "reject") {
      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: vpUser.id,
          rejection_reason: notes || "Rejected by VP",
          rejection_stage: "vp",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: "pending_vp",
        new_status: "rejected",
        comments: notes || "Rejected by VP",
      });

      console.log(`[VP Reject] ❌ Request ${requestId} rejected`);
      
      return NextResponse.json({
        ok: true,
        message: "Request rejected",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[VP Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
