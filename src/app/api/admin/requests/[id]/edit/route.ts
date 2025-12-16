// src/app/api/admin/requests/[id]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // Create server client with same pattern as /api/me
    const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options.path || '/',
            });
          } catch {
            // Handle cookie setting errors silently
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options.path || '/',
              maxAge: 0,
            });
          } catch {
            // Handle cookie removal errors silently
          }
        },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.log("[admin/edit] User not found:", userError?.message);
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    console.log("[admin/edit] User found:", user.email);

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check if user is admin - use auth_user_id to find the user
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("id, role, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    // Admin check - same logic as admin/approve route
    // Check is_admin flag (boolean), role, or email
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
    const userEmail = userData?.email?.toLowerCase() || user.email?.toLowerCase() || '';
    const isAdmin = userData?.is_admin === true || userData?.role === "admin" || adminEmails.includes(userEmail);

    if (roleError || !userData || !isAdmin) {
      console.log("[admin/edit] Role check failed:", roleError?.message, {
        role: userData?.role,
        is_admin: userData?.is_admin,
        email: userEmail
      });
      return NextResponse.json({ ok: false, error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const userId = userData.id; // Use the users table ID, not auth user ID
    console.log("[admin/edit] Admin verified:", userEmail, "userId:", userId, "is_admin:", userData.is_admin);

    // Get current request data for logging
    const { data: currentRequest, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Allowed fields that admin can edit
    const allowedFields = [
      "purpose",
      "destination",
      "travel_start_date",
      "travel_end_date",
      "total_budget",
      "expense_breakdown",
      "transportation_type",
      "pickup_location",
      "pickup_time",
      "pickup_contact_number",
      "pickup_special_instructions",
      "dropoff_location",
      "dropoff_time",
      "cost_justification",
      "preferred_vehicle_id",
      "preferred_driver_id",
      "preferred_vehicle_note",
      "preferred_driver_note",
      "assigned_vehicle_id",
      "assigned_driver_id",
      "admin_notes",
    ];

    // Filter updates to only allowed fields
    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        // Handle type conversions
        if (key === 'total_budget') {
          filteredUpdates[key] = parseFloat(updates[key]) || 0;
        } else if (key === 'pickup_time' || key === 'dropoff_time') {
          // Time fields: convert empty string to null for PostgreSQL
          filteredUpdates[key] = updates[key] === '' ? null : updates[key];
        } else if (key === 'travel_start_date' || key === 'travel_end_date') {
          // Date fields: convert empty string to null for PostgreSQL
          filteredUpdates[key] = updates[key] === '' ? null : updates[key];
        } else {
          filteredUpdates[key] = updates[key];
        }
      }
    }
    
    console.log("[admin/edit] Received updates:", updates);
    console.log("[admin/edit] Filtered updates:", filteredUpdates);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    // Add metadata - only use columns that exist in the table
    filteredUpdates.updated_at = new Date().toISOString();

    console.log("[admin/edit] Updating request with fields:", Object.keys(filteredUpdates));

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from("requests")
      .update(filteredUpdates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/edit] Update error:", updateError.message, updateError.details, updateError.hint);
      return NextResponse.json({ ok: false, error: `Failed to update request: ${updateError.message}` }, { status: 500 });
    }

    // Log the edit action to request_history
    const editedFields = Object.keys(filteredUpdates).filter(k => k !== 'updated_at');
    
    // User-friendly field name mappings
    const fieldLabels: Record<string, string> = {
      purpose: "Purpose",
      destination: "Destination",
      travel_start_date: "Travel Start Date",
      travel_end_date: "Travel End Date",
      total_budget: "Total Budget",
      expense_breakdown: "Expense Breakdown",
      transportation_type: "Transportation Type",
      pickup_location: "Pickup Location",
      pickup_time: "Pickup Time",
      pickup_contact_number: "Contact Number",
      pickup_special_instructions: "Special Instructions",
      dropoff_location: "Drop-off Location",
      dropoff_time: "Drop-off Time",
      cost_justification: "Cost Justification",
      preferred_vehicle_id: "Preferred Vehicle",
      preferred_driver_id: "Preferred Driver",
      preferred_vehicle_note: "Vehicle Notes",
      preferred_driver_note: "Driver Notes",
      assigned_vehicle_id: "Assigned Vehicle",
      assigned_driver_id: "Assigned Driver",
      admin_notes: "Admin Notes",
    };
    
    // Generate user-friendly comment
    const friendlyFields = editedFields.map(f => fieldLabels[f] || f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    let friendlyComment = '';
    if (friendlyFields.length <= 3) {
      friendlyComment = `Updated: ${friendlyFields.join(', ')}`;
    } else {
      friendlyComment = `Updated ${friendlyFields.length} fields: ${friendlyFields.slice(0, 3).join(', ')} and ${friendlyFields.length - 3} more`;
    }
    
    try {
      await supabase.from("request_history").insert({
        request_id: id,
        action: "admin_edited",
        actor_id: userId,
        actor_role: "admin",
        previous_status: currentRequest.status,
        new_status: currentRequest.status,
        comments: friendlyComment,
        metadata: {
          edited_fields: editedFields,
          friendly_fields: friendlyFields,
          previous_values: Object.fromEntries(
            editedFields.map(k => [k, currentRequest[k]])
          ),
          new_values: Object.fromEntries(
            editedFields.map(k => [k, filteredUpdates[k]])
          ),
        },
      });
    } catch (historyError) {
      console.warn("[admin/edit] Failed to log history:", historyError);
      // Don't fail the request if history logging fails
    }

    return NextResponse.json({ ok: true, data: updatedRequest });
  } catch (error) {
    console.error("[admin/edit] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
