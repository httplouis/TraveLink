// src/app/login/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import LoginView from "./LoginView";
import LoadingModal from "@/components/common/LoadingModal";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") ?? null;

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to Microsoft...");

  // Check if user already logged in via Supabase session
  // Only redirect if there's a nextUrl (came from middleware redirect)
  React.useEffect(() => {
    if (!nextUrl) return; // Don't auto-redirect if manually visiting /login
    
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && nextUrl) {
        // Already logged in and trying to access protected page
        router.push(nextUrl);
      }
    });
  }, [nextUrl, router]);

  async function handleMicrosoftLogin() {
    setLoading(true);
    setErr("");
    setLoadingMessage("Redirecting to Microsoft...");

    try {
      const supabase = createSupabaseClient();
      
      // Get redirect URL
      const redirectTo = `${window.location.origin}/api/auth/callback`;
      
      // Sign in with Microsoft OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo,
          scopes: 'openid profile email User.Read',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("[login] OAuth error:", error);
        
        // Check for specific error codes
        if (error.message?.includes("provider is not enabled") || error.message?.includes("Unsupported provider")) {
          setErr("Azure provider is not enabled in Supabase. Please configure it in Supabase Dashboard → Authentication → Providers → Enable Azure");
        } else {
          setErr(error.message || 'Failed to connect to Microsoft');
        }
        setLoading(false);
        return;
      }

      // Redirect will happen automatically
      // User will be redirected to Microsoft login, then back to /api/auth/callback
      
    } catch (error: any) {
      setErr(error.message || 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <>
      <LoginView
        loading={loading}
        err={err}
        onMicrosoftLogin={handleMicrosoftLogin}
      />
      <LoadingModal isOpen={loading} message={loadingMessage} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
