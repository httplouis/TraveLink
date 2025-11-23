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
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Load remembered email and failed attempts on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    
    // Load failed attempts (check if within last 15 minutes)
    const attemptsData = localStorage.getItem('failedLoginAttempts');
    if (attemptsData) {
      try {
        const { count, timestamp } = JSON.parse(attemptsData);
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        
        if (now - timestamp < fifteenMinutes) {
          setFailedAttempts(count);
          if (count >= 3) {
            setShowForgotPassword(true);
          }
        } else {
          // Reset if older than 15 minutes
          localStorage.removeItem('failedLoginAttempts');
        }
      } catch (e) {
        localStorage.removeItem('failedLoginAttempts');
      }
    }
  }, []);

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
    setMicrosoftLoading(true);
    setErr("");

    try {
      const supabase = createSupabaseClient();
      
      // Get redirect URL - always use current origin to ensure correct URL
      // In production (Vercel), window.location.origin will be the Vercel URL
      // In local dev, it will be localhost:3000
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/api/auth/callback`;
      
      console.log("[login] OAuth redirect URL:", redirectTo);
      console.log("[login] Current origin:", baseUrl);
      console.log("[login] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "not set");
      
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
        setMicrosoftLoading(false);
        return;
      }

      // Redirect will happen automatically
      // User will be redirected to Microsoft login, then back to /api/auth/callback
      
    } catch (error: any) {
      setErr(error.message || 'An error occurred');
      setMicrosoftLoading(false);
    }
  }

  async function handleEmailLogin() {
    setEmailLoading(true);
    setErr("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Track failed attempts
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('failedLoginAttempts', JSON.stringify({
            count: newAttempts,
            timestamp: Date.now()
          }));
        }
        
        if (newAttempts >= 3) {
          setShowForgotPassword(true);
        }
        
        throw new Error(data.error || "Login failed");
      }

      // Success - clear failed attempts and handle remember me
      if (typeof window !== 'undefined') {
        localStorage.removeItem('failedLoginAttempts');
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      }
      
      setFailedAttempts(0);
      setShowForgotPassword(false);

      // CRITICAL: Use window.location.href instead of router.push() to ensure
      // cookies are properly set and sent with subsequent requests
      // router.push() is client-side navigation and might not wait for cookies
      window.location.href = data.redirectPath || "/user";
    } catch (error: any) {
      setErr(error.message || 'Login failed. Please check your credentials.');
      setEmailLoading(false);
    }
  }

  return (
    <LoginView
      microsoftLoading={microsoftLoading}
      emailLoading={emailLoading}
      err={err}
      email={email}
      password={password}
      rememberMe={rememberMe}
      showForgotPassword={showForgotPassword}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onRememberMeChange={setRememberMe}
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
