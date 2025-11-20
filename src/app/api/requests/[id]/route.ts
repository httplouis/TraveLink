// Get full request details by ID
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let requestId: string | undefined;
  try {
    console.log("[GET /api/requests/[id]] ========== STARTING REQUEST ==========");
    
    // Step 1: Get params
    try {
      console.log("[GET /api/requests/[id]] Step 1: Getting params...");
      const resolvedParams = await params;
      requestId = resolvedParams.id;
      console.log("[GET /api/requests/[id]] Step 1: ✅ Request ID:", requestId);
      
      if (!requestId) {
        console.error("[GET /api/requests/[id]] Step 1: ❌ Missing request ID");
        return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
      }
    } catch (paramsErr: any) {
      console.error("[GET /api/requests/[id]] Step 1: ❌ ERROR getting params:", {
        message: paramsErr?.message,
        stack: paramsErr?.stack
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to parse request parameters",
        details: paramsErr?.message 
      }, { status: 400 });
    }

    // Step 2: Create Supabase clients
    let supabase: any; // For auth
    let supabaseServiceRole: any; // For queries (bypasses RLS)
    try {
      console.log("[GET /api/requests/[id]] Step 2: Creating Supabase clients...");
      
      // Use createServerClient for auth (needs cookies)
      supabase = await createSupabaseServerClient(false);
      
      // Use createClient directly for queries to truly bypass RLS
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[GET /api/requests/[id]] Step 2: ❌ Missing Supabase configuration");
        return NextResponse.json({ 
          ok: false, 
          error: "Missing Supabase configuration"
        }, { status: 500 });
      }
      
      supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      
      console.log("[GET /api/requests/[id]] Step 2: ✅ Supabase clients created");
    } catch (supabaseErr: any) {
      console.error("[GET /api/requests/[id]] Step 2: ❌ ERROR creating Supabase clients:", {
        message: supabaseErr?.message,
        stack: supabaseErr?.stack
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to initialize database connection",
        details: supabaseErr?.message 
      }, { status: 500 });
    }

    // Step 3: Authenticate
    try {
      console.log("[GET /api/requests/[id]] Step 3: Authenticating user...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("[GET /api/requests/[id]] Step 3: ❌ Auth error:", authError);
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      console.log("[GET /api/requests/[id]] Step 3: ✅ User authenticated:", user.id);
    } catch (authErr: any) {
      console.error("[GET /api/requests/[id]] Step 3: ❌ ERROR during authentication:", {
        message: authErr?.message,
        stack: authErr?.stack
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Authentication failed",
        details: authErr?.message 
      }, { status: 401 });
    }

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Step 4: Fetch main request
    console.log(`[GET /api/requests/[id]] Step 4: Fetching request with ID: ${requestId}`);
    let request: any;
    try {
      // Use service role client to bypass RLS completely
      // Use maybeSingle() instead of single() to handle 0 rows gracefully
      const { data, error } = await supabaseServiceRole
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        console.error("[GET /api/requests/[id]] Step 4: ❌ DATABASE ERROR:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return NextResponse.json({ 
          ok: false, 
          error: error.message || "Failed to fetch request",
          code: error.code,
          details: error.details
        }, { status: 500 });
      }

      if (!data) {
        console.warn(`[GET /api/requests/[id]] Step 4: ❌ Request not found: ${requestId}`);
        // Request not found - return 404
        console.error(`[GET /api/requests/[id]] Step 4: Request ID ${requestId} not found in database`);
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      } else {
        request = data;
        console.log(`[GET /api/requests/[id]] Step 4: ✅ Request fetched:`, {
          id: request.id,
          request_number: request.request_number,
          status: request.status
        });
      }
    } catch (e: any) {
      console.error("[GET /api/requests/[id]] Step 4: ❌ EXCEPTION:", {
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
        cause: e?.cause
      });
      return NextResponse.json({ 
        ok: false, 
        error: e?.message || "Failed to fetch request",
        details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
      }, { status: 500 });
    }

    // Step 5: Fetch related data separately to avoid foreign key relationship issues
    console.log(`[GET /api/requests/[id]] Step 5: Fetching related data...`);
    const relatedData: any = {};

    // Fetch requester
    if (request.requester_id) {
      try {
        const { data: requester, error: requesterError } = await supabaseServiceRole
          .from("users")
          .select("id, name, email, profile_picture, phone_number, position_title, department_id")
          .eq("id", request.requester_id)
          .single();
        if (requester && !requesterError) {
          relatedData.requester = requester;
          // Fetch requester's department
          if (requester.department_id) {
            try {
                    const { data: dept, error: deptError } = await supabaseServiceRole
                      .from("departments")
                .select("id, name, code")
                .eq("id", requester.department_id)
                .single();
              if (dept && !deptError) {
                relatedData.requester.department = dept;
              }
            } catch (e) {
              console.warn(`[GET /api/requests/${requestId}] Error fetching requester department:`, e);
            }
          }
        } else if (requesterError) {
          console.warn(`[GET /api/requests/${requestId}] Error fetching requester:`, requesterError);
        }
      } catch (e) {
        console.warn(`[GET /api/requests/${requestId}] Exception fetching requester:`, e);
      }
    }

    // Fetch request department
    if (request.department_id) {
      try {
        const { data: dept, error: deptError } = await supabaseServiceRole
          .from("departments")
          .select("id, code, name")
          .eq("id", request.department_id)
          .single();
        if (dept && !deptError) {
          relatedData.department = dept;
        } else if (deptError) {
          console.warn(`[GET /api/requests/${requestId}] Error fetching department:`, deptError);
        }
      } catch (e) {
        console.warn(`[GET /api/requests/${requestId}] Exception fetching department:`, e);
      }
    }

    // Fetch submitted_by user
    if (request.submitted_by_user_id) {
      try {
        const { data: submittedBy, error: submittedByError } = await supabaseServiceRole
          .from("users")
          .select("id, name, email, profile_picture, phone_number, position_title")
          .eq("id", request.submitted_by_user_id)
          .single();
        if (submittedBy && !submittedByError) {
          relatedData.submitted_by = submittedBy;
        } else if (submittedByError) {
          console.warn(`[GET /api/requests/${requestId}] Error fetching submitted_by:`, submittedByError);
        }
      } catch (e) {
        console.warn(`[GET /api/requests/${requestId}] Exception fetching submitted_by:`, e);
      }
    }

    // Fetch approvers (simplified - only fetch if IDs exist)
    const approverFields = [
      'head_approved_by', 'parent_head_approved_by', 'vp_approved_by',
      'admin_approved_by', 'comptroller_approved_by', 'hr_approved_by',
      'vp2_approved_by', 'president_approved_by', 'exec_approved_by'
    ];

    for (const field of approverFields) {
      const approverId = request[field];
      if (approverId) {
              try {
                const { data: approver, error: approverError } = await supabaseServiceRole
                  .from("users")
                  .select("id, name, email, profile_picture, phone_number, position_title, department_id, is_head, is_vp")
                  .eq("id", approverId)
                  .single();
          if (approver && !approverError) {
            const approverKey = field.replace('_approved_by', '_approver');
            relatedData[approverKey] = approver;
            // Fetch department if exists
            if (approver.department_id) {
              try {
                    const { data: dept, error: deptError } = await supabaseServiceRole
                      .from("departments")
                  .select("id, name, code")
                  .eq("id", approver.department_id)
                  .single();
                if (dept && !deptError) {
                  relatedData[approverKey].department = dept;
                }
              } catch (e) {
                console.warn(`[GET /api/requests/${requestId}] Error fetching department for approver ${approverId}:`, e);
              }
            }
          }
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Error fetching approver ${field}:`, e);
          // Continue with other approvers even if one fails
        }
      }
    }

    // Step 6: Merge related data into request
    console.log(`[GET /api/requests/[id]] Step 6: Merging related data...`);
    let fullRequest: any;
    try {
      fullRequest = { ...request, ...relatedData };
      console.log(`[GET /api/requests/${requestId}] Step 6: ✅ Merged related data successfully`);
    } catch (e: any) {
      console.error(`[GET /api/requests/${requestId}] Step 6: ❌ Error merging:`, {
        message: e?.message,
        stack: e?.stack
      });
      // If merge fails, just return the request without related data
      fullRequest = request;
    }

    // Fetch preferred driver and vehicle names if IDs are present
    console.log(`[GET /api/requests/${requestId}] Preferred driver ID:`, fullRequest.preferred_driver_id);
    console.log(`[GET /api/requests/${requestId}] Preferred vehicle ID:`, fullRequest.preferred_vehicle_id);
    
    if (fullRequest.preferred_driver_id || fullRequest.preferred_vehicle_id) {
      // Fetch driver name
      if (fullRequest.preferred_driver_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching driver name for ID:`, fullRequest.preferred_driver_id);
        const { data: driver, error: driverError } = await supabaseServiceRole
          .from("users")
          .select("name")
          .eq("id", fullRequest.preferred_driver_id)
          .single();
        
        if (driverError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching driver:`, driverError);
        }
        
        if (driver) {
          fullRequest.preferred_driver_name = driver.name;
          console.log(`[GET /api/requests/${requestId}] Driver name found:`, driver.name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Driver not found for ID:`, fullRequest.preferred_driver_id);
        }
      }

      // Fetch vehicle name
      if (fullRequest.preferred_vehicle_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching vehicle for ID:`, fullRequest.preferred_vehicle_id);
        const { data: vehicle, error: vehicleError } = await supabaseServiceRole
          .from("vehicles")
          .select("vehicle_name, plate_number")
          .eq("id", fullRequest.preferred_vehicle_id)
          .single();
        
        if (vehicleError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching vehicle:`, vehicleError);
        }
        
        if (vehicle) {
          fullRequest.preferred_vehicle_name = `${vehicle.vehicle_name} • ${vehicle.plate_number}`;
          console.log(`[GET /api/requests/${requestId}] Vehicle found:`, fullRequest.preferred_vehicle_name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Vehicle not found for ID:`, fullRequest.preferred_vehicle_id);
        }
      }
    } else {
      console.log(`[GET /api/requests/${requestId}] No driver or vehicle preferences set`);
    }

    // Fetch ASSIGNED driver and vehicle names if IDs are present (admin-assigned)
    console.log(`[GET /api/requests/${requestId}] Assigned driver ID:`, fullRequest.assigned_driver_id);
    console.log(`[GET /api/requests/${requestId}] Assigned vehicle ID:`, fullRequest.assigned_vehicle_id);
    
    if (fullRequest.assigned_driver_id || fullRequest.assigned_vehicle_id) {
      // Fetch assigned driver name (from drivers table -> users table)
      if (fullRequest.assigned_driver_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching assigned driver for ID:`, fullRequest.assigned_driver_id);
        try {
          // First get the user_id from drivers table
          const { data: driverRecord, error: driverRecordError } = await supabaseServiceRole
            .from("drivers")
            .select("user_id")
            .eq("id", fullRequest.assigned_driver_id)
            .single();
          
          if (driverRecordError) {
            console.error(`[GET /api/requests/${requestId}] Error fetching driver record:`, driverRecordError);
          } else if (driverRecord && driverRecord.user_id) {
            // Then get the user's name
            const { data: driverUser, error: driverUserError } = await supabaseServiceRole
              .from("users")
              .select("id, name, email, phone_number, profile_picture")
              .eq("id", driverRecord.user_id)
              .single();
            
            if (driverUserError) {
              console.error(`[GET /api/requests/${requestId}] Error fetching driver user:`, driverUserError);
            } else if (driverUser) {
              fullRequest.assigned_driver = {
                id: driverUser.id,
                name: driverUser.name,
                email: driverUser.email,
                phone: driverUser.phone_number,
                profile_picture: driverUser.profile_picture
              };
              fullRequest.assigned_driver_name = driverUser.name;
              console.log(`[GET /api/requests/${requestId}] Assigned driver found:`, driverUser.name);
            }
          }
        } catch (e: any) {
          console.error(`[GET /api/requests/${requestId}] Exception fetching assigned driver:`, e);
        }
      }

      // Fetch assigned vehicle name
      if (fullRequest.assigned_vehicle_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching assigned vehicle for ID:`, fullRequest.assigned_vehicle_id);
        const { data: vehicle, error: vehicleError } = await supabaseServiceRole
          .from("vehicles")
          .select("id, vehicle_name, plate_number, vehicle_type, capacity")
          .eq("id", fullRequest.assigned_vehicle_id)
          .single();
        
        if (vehicleError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching assigned vehicle:`, vehicleError);
        } else if (vehicle) {
          fullRequest.assigned_vehicle = {
            id: vehicle.id,
            name: vehicle.vehicle_name,
            plate_number: vehicle.plate_number,
            type: vehicle.vehicle_type,
            capacity: vehicle.capacity
          };
          fullRequest.assigned_vehicle_name = `${vehicle.vehicle_name} • ${vehicle.plate_number}`;
          console.log(`[GET /api/requests/${requestId}] Assigned vehicle found:`, fullRequest.assigned_vehicle_name);
        }
      }
    } else {
      console.log(`[GET /api/requests/${requestId}] No assigned driver or vehicle set`);
    }

    // Parse seminar_data if it's a string
    try {
      if (fullRequest.seminar_data && typeof fullRequest.seminar_data === 'string') {
        try {
          fullRequest.seminar_data = JSON.parse(fullRequest.seminar_data);
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Failed to parse seminar_data:`, e);
        }
      }
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error processing seminar_data:`, e);
    }

    // Parse expense_breakdown if it's a string (JSONB from database)
    try {
      if (fullRequest.expense_breakdown && typeof fullRequest.expense_breakdown === 'string') {
        try {
          fullRequest.expense_breakdown = JSON.parse(fullRequest.expense_breakdown);
          console.log(`[GET /api/requests/${requestId}] Parsed expense_breakdown:`, fullRequest.expense_breakdown);
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Failed to parse expense_breakdown:`, e);
          fullRequest.expense_breakdown = null;
        }
      }

      // Ensure expense_breakdown is always an array or null
      if (fullRequest.expense_breakdown && !Array.isArray(fullRequest.expense_breakdown)) {
        console.warn(`[GET /api/requests/${requestId}] expense_breakdown is not an array, converting...`);
        fullRequest.expense_breakdown = null;
      }
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error processing expense_breakdown:`, e);
      fullRequest.expense_breakdown = null;
    }

    // Log expense_breakdown for debugging
    try {
      console.log(`[GET /api/requests/${requestId}] Expense breakdown:`, {
        type: typeof fullRequest.expense_breakdown,
        isArray: Array.isArray(fullRequest.expense_breakdown),
        length: Array.isArray(fullRequest.expense_breakdown) ? fullRequest.expense_breakdown.length : null,
        total_budget: fullRequest.total_budget,
        comptroller_edited_budget: fullRequest.comptroller_edited_budget,
        value: fullRequest.expense_breakdown
      });
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error logging expense_breakdown:`, e);
    }

    // Parse workflow_metadata if it's a string
    try {
      if (fullRequest.workflow_metadata && typeof fullRequest.workflow_metadata === 'string') {
        try {
          fullRequest.workflow_metadata = JSON.parse(fullRequest.workflow_metadata);
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Failed to parse workflow_metadata:`, e);
        }
      }
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error processing workflow_metadata:`, e);
    }

    // Parse destination_geo if it's a string
    try {
      if (fullRequest.destination_geo && typeof fullRequest.destination_geo === 'string') {
        try {
          fullRequest.destination_geo = JSON.parse(fullRequest.destination_geo);
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Failed to parse destination_geo:`, e);
        }
      }
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error processing destination_geo:`, e);
    }

    // Parse attachments if it's a string (JSONB from database)
    try {
      if (fullRequest.attachments && typeof fullRequest.attachments === 'string') {
        try {
          fullRequest.attachments = JSON.parse(fullRequest.attachments);
          console.log(`[GET /api/requests/${requestId}] Parsed attachments:`, {
            count: Array.isArray(fullRequest.attachments) ? fullRequest.attachments.length : 0,
            attachments: fullRequest.attachments
          });
        } catch (e) {
          console.warn(`[GET /api/requests/${requestId}] Failed to parse attachments:`, e);
          fullRequest.attachments = [];
        }
      }
      // Ensure attachments is always an array
      if (fullRequest.attachments && !Array.isArray(fullRequest.attachments)) {
        console.warn(`[GET /api/requests/${requestId}] attachments is not an array, converting...`);
        fullRequest.attachments = [];
      }
    } catch (e) {
      console.warn(`[GET /api/requests/${requestId}] Error processing attachments:`, e);
      fullRequest.attachments = [];
    }

    // Step 7: Clean up and serialize response
    console.log(`[GET /api/requests/[id]] Step 7: Serializing response...`);
    try {
      // Remove any functions or circular references
      const cleanData = JSON.parse(JSON.stringify(fullRequest, (key, value) => {
        // Remove functions
        if (typeof value === 'function') {
          return undefined;
        }
        // Remove undefined values
        if (value === undefined) {
          return null;
        }
        return value;
      }));
      
      console.log(`[GET /api/requests/${requestId}] Step 7: ✅ Successfully serialized, returning response`);
      return NextResponse.json({ ok: true, data: cleanData });
    } catch (e: any) {
      console.error(`[GET /api/requests/${requestId}] Step 7: ❌ SERIALIZATION ERROR:`, {
        message: e?.message,
        stack: e?.stack,
        name: e?.name
      });
      // Try to return at least basic request data
      try {
        console.log(`[GET /api/requests/${requestId}] Step 7: Attempting fallback serialization...`);
        const basicData = JSON.parse(JSON.stringify(request, (key, value) => {
          if (typeof value === 'function' || value === undefined) return null;
          return value;
        }));
        console.log(`[GET /api/requests/${requestId}] Step 7: ✅ Fallback serialization successful`);
        return NextResponse.json({ ok: true, data: basicData });
      } catch (fallbackErr: any) {
        console.error(`[GET /api/requests/${requestId}] Step 7: ❌ Fallback also failed:`, {
          message: fallbackErr?.message,
          stack: fallbackErr?.stack
        });
        throw e; // Re-throw original error to be caught by outer catch
      }
    }
  } catch (err: any) {
    console.error("[GET /api/requests/[id]] ========== UNEXPECTED ERROR ==========");
    console.error("[GET /api/requests/[id]] Error message:", err?.message);
    console.error("[GET /api/requests/[id]] Error name:", err?.name);
    console.error("[GET /api/requests/[id]] Error code:", err?.code);
    console.error("[GET /api/requests/[id]] Error stack:", err?.stack);
    console.error("[GET /api/requests/[id]] Error cause:", err?.cause);
    console.error("[GET /api/requests/[id]] Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    // Try to return at least the basic request data if we can get it
    if (requestId) {
      try {
        console.log("[GET /api/requests/[id]] Attempting fallback: fetching basic request...");
        // Use direct createClient for fallback to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseServiceKey) {
          const fallbackClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });
          const { data: basicRequest, error: basicError } = await fallbackClient
            .from("requests")
            .select("*")
            .eq("id", requestId)
            .maybeSingle();
        
          if (basicRequest && !basicError) {
            console.log("[GET /api/requests/[id]] ✅ Fallback successful: returning basic request data");
            // Clean the data before returning
            try {
              const cleanData = JSON.parse(JSON.stringify(basicRequest, (key, value) => {
                if (typeof value === 'function' || value === undefined) return null;
                return value;
              }));
              return NextResponse.json({ ok: true, data: cleanData });
            } catch (cleanErr) {
              console.error("[GET /api/requests/[id]] Error cleaning fallback data:", cleanErr);
              return NextResponse.json({ ok: true, data: basicRequest });
            }
          } else if (basicError) {
            console.error("[GET /api/requests/[id]] ❌ Fallback query error:", {
              message: basicError.message,
              code: basicError.code,
              details: basicError.details
            });
          } else {
            console.error("[GET /api/requests/[id]] ❌ Fallback: No data returned");
          }
        } else {
          console.error("[GET /api/requests/[id]] ❌ Fallback: Missing Supabase configuration");
        }
      } catch (fallbackErr: any) {
        console.error("[GET /api/requests/[id]] ❌ Fallback exception:", {
          message: fallbackErr?.message,
          stack: fallbackErr?.stack
        });
      }
    } else {
      console.error("[GET /api/requests/[id]] ❌ No requestId available for fallback");
    }
    
    // Return error with detailed info in development
    const errorResponse: any = { 
      ok: false, 
      error: err?.message || "Internal server error"
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = err?.stack;
      errorResponse.errorName = err?.name;
      errorResponse.errorCode = err?.code;
    }
    
    console.error("[GET /api/requests/[id]] ========== RETURNING ERROR ==========");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PATCH /api/requests/[id]
 * Update request details (admin only - for assigning vehicles, drivers, editing budget, etc.)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Parse request body first to check if it's a cancellation
    const body = await req.json();
    const isCancellation = body.status === "cancelled";

    // Get request to verify it exists and check permissions
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, status, requester_id, submitted_by_user_id")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user is admin OR the requester (for cancellation)
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "comptroller@mseuf.edu.ph"];
    const isAdmin = adminEmails.includes(profile.email) || profile.is_admin;
    
    const isRequester = request.requester_id === profile.id || request.submitted_by_user_id === profile.id;
    
    // Allow cancellation if user is requester AND request is still pending
    if (isCancellation && isRequester && (request.status.startsWith("pending_") || request.status === "draft")) {
      // Requester can cancel their own pending requests - allow this
    } else if (!isAdmin) {
      return NextResponse.json({ 
        ok: false, 
        error: "Only admins can update requests" 
      }, { status: 403 });
    }

    // Parse request body fields
    const {
      assigned_driver_id,
      assigned_vehicle_id,
      admin_notes,
      admin_comments,
      total_budget,
      expense_breakdown,
      cost_justification,
      attachments, // Allow updating attachments
      // Allow updating other fields as needed
      ...otherFields
    } = body;

    // Build update object - only allow specific fields to be updated
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Admin can assign driver and vehicle
    if (assigned_driver_id !== undefined) {
      updateData.assigned_driver_id = assigned_driver_id || null;
    }
    if (assigned_vehicle_id !== undefined) {
      updateData.assigned_vehicle_id = assigned_vehicle_id || null;
    }

    // Admin can add notes/comments
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes || null;
    }
    if (admin_comments !== undefined) {
      updateData.admin_comments = admin_comments || null;
    }

    // Admin can edit budget (for budget adjustments)
    if (total_budget !== undefined) {
      updateData.total_budget = total_budget;
    }
    if (expense_breakdown !== undefined) {
      updateData.expense_breakdown = expense_breakdown;
    }
    if (cost_justification !== undefined) {
      updateData.cost_justification = cost_justification || null;
    }

    // Allow updating attachments
    if (attachments !== undefined) {
      updateData.attachments = Array.isArray(attachments) ? attachments : [];
      console.log(`[PATCH /api/requests/${requestId}] Updating attachments:`, {
        count: updateData.attachments.length,
        attachments: updateData.attachments
      });
    }

    // Allow other safe fields to be updated
    const allowedFields = [
      'admin_processed_at',
      'admin_processed_by',
      'admin_signature',
      'needs_vehicle',
      'needs_rental',
      'has_budget',
      'status', // Allow status updates (for cancellation by requester)
    ];

    for (const field of allowedFields) {
      if (otherFields[field] !== undefined) {
        updateData[field] = otherFields[field];
      }
    }

    // If cancelling, add cancellation metadata
    if (isCancellation && isRequester) {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = profile.id;
      updateData.cancellation_reason = body.cancellation_reason || "Cancelled by requester";
    }

    // Update request
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/requests/[id]] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log update in history
    const actorRole = isCancellation && isRequester ? "requester" : "admin";
    const action = isCancellation ? "cancelled" : "updated";
    const comments = isCancellation 
      ? (body.cancellation_reason || "Cancelled by requester")
      : (admin_comments || admin_notes || "Request updated by admin");
    
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: action,
      actor_id: profile.id,
      actor_role: actorRole,
      previous_status: request.status,
      new_status: updateData.status || request.status,
      comments: comments,
      metadata: {
        updated_fields: Object.keys(updateData),
        update_time: new Date().toISOString(),
        cancelled_by_requester: isCancellation && isRequester,
      }
    });

    console.log("[PATCH /api/requests/[id]] Request updated:", requestId, "By:", profile.email);

    return NextResponse.json({ 
      ok: true, 
      data: updated,
      message: "Request updated successfully"
    });

  } catch (err: any) {
    console.error("[PATCH /api/requests/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
