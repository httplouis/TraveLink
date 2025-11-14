// src/app/api/profile/force-update/route.ts
/**
 * Force Update Profile - Manual endpoint to update user profile from Graph API
 * Use this if profile data didn't sync during login
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(false);
    const supabaseAdmin = await createSupabaseServerClient(true);
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "No email found" }, { status: 400 });
    }

    // Try to fetch from email directory API
    // Get base URL from request
    let baseUrl = 'http://localhost:3000';
    try {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // Fallback to localhost if URL parsing fails
      console.warn('[force-update] Could not parse URL, using localhost');
    }
    
    console.log(`[force-update] Fetching from email directory: ${baseUrl}/api/email-directory?email=${encodeURIComponent(userEmail)}`);
    const emailDirResponse = await fetch(`${baseUrl}/api/email-directory?email=${encodeURIComponent(userEmail)}`);
    let graphProfile: any = null;
    
    if (emailDirResponse.ok) {
      const emailDirData = await emailDirResponse.json();
      if (emailDirData.ok && emailDirData.data) {
        graphProfile = {
          displayName: emailDirData.data.name,
          department: emailDirData.data.department,
          jobTitle: emailDirData.data.position,
        };
        console.log(`[force-update] ✅ Profile retrieved from email directory:`, graphProfile);
      }
    }

    // Get user from database
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, name, department, department_id, position_title")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!existingUser) {
      return NextResponse.json({ ok: false, error: "User not found in database" }, { status: 404 });
    }

    const userName = graphProfile?.displayName || existingUser.name || userEmail.split("@")[0];
    const userDepartment = graphProfile?.department || null;
    const userPosition = graphProfile?.jobTitle || null;

    // Update user profile
    const updateData: any = {
      name: userName,
      email: userEmail,
    };

    if (userDepartment) {
      // Try to find department by name
      const { data: dept } = await supabaseAdmin
        .from("departments")
        .select("id")
        .ilike("name", `%${userDepartment}%`)
        .limit(1)
        .single();

      if (dept) {
        updateData.department_id = dept.id;
        updateData.department = null;
      } else {
        updateData.department = userDepartment;
        updateData.department_id = null;
      }
    }

    if (userPosition) {
      updateData.position_title = userPosition;
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", existingUser.id);

    if (updateError) {
      console.error(`[force-update] ❌ Failed to update:`, updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    console.log(`[force-update] ✅ Profile updated:`, updateData);
    return NextResponse.json({ ok: true, data: updateData });

  } catch (err: any) {
    console.error("[force-update] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

