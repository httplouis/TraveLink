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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      // Call server-side login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErr(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect to the path determined by the server
      const redirectPath = nextUrl || data.redirectPath || '/user';
      window.location.href = redirectPath;

    } catch (error: any) {
      setErr(error.message || 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <LoginView
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      loading={loading}
      err={err}
      onSubmit={onSubmit}
      remember={remember}
      setRemember={setRemember}
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
