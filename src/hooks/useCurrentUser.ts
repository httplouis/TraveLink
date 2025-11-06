"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "faculty" | "head" | "org" | "admin";
  department?: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser || !mounted) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch full user profile from users table
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, name, role, department")
          .eq("id", authUser.id)
          .single();

        if (mounted && profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            department: profile.department,
          });
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
