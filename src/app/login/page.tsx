// src/app/login/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import LoginView from "./LoginView";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") ?? null;

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"microsoft" | "email">("microsoft");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    try {
      const supabase = createSupabaseClient();
      
      // Get redirect URL - use environment variable if available, otherwise use current origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectTo = `${baseUrl}/api/auth/callback`;
      
      console.log("[login] OAuth redirect URL:", redirectTo);
      
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

  async function handleEmailLogin() {
    setLoading(true);
    setErr("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect to the appropriate portal
      router.push(data.redirectPath || "/user");
    } catch (error: any) {
      setErr(error.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  }

  return (
    <LoginView
      loading={loading}
      err={err}
      loginMode={loginMode}
      email={email}
      password={password}
      onLoginModeChange={setLoginMode}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onMicrosoftLogin={handleMicrosoftLogin}
      onEmailLogin={handleEmailLogin}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
