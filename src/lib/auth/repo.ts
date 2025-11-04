import { createSupabaseClient } from "@/lib/supabase/client";

export const AuthRepo = {
  async signOut() {
    try {
      if (typeof window !== "undefined") {
        const supabase = createSupabaseClient();
        await supabase.auth.signOut();
        localStorage.removeItem("tl.session");
        localStorage.removeItem("tl.user");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};
