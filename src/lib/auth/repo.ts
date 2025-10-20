let supabaseClient: any = null;
try { supabaseClient = require("@/supabaseClient").supabase; } catch {}
export const AuthRepo = {
  async signOut() {
    try { if (supabaseClient?.auth?.signOut) await supabaseClient.auth.signOut(); } catch {}
    try { if (typeof window !== "undefined") {
      localStorage.removeItem("tl.session");
      localStorage.removeItem("tl.user");
    }} catch {}
  },
};
