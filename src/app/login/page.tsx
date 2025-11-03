// src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // ← named import
import LoginView from "./LoginView";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // 1) login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    // 2) get current user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setErr(userErr?.message || "No user returned from Supabase.");
      setLoading(false);
      return;
    }

    // 3) get app-level role
    const { data: profile, error: profErr } = await supabase
      .from("users")
      .select("role, department")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profErr) {
      setErr(profErr.message);
      setLoading(false);
      return;
    }

    const role = profile?.role ?? "faculty";

    // 4) redirect
    if (nextUrl) {
      router.push(nextUrl);
    } else {
      switch (role) {
        case "admin":
          router.push("/admin");
          break;
        case "head":
          router.push("/head/inbox");
          break;
        case "hr":
          router.push("/hr/inbox");
          break;
        case "exec":
          router.push("/exec/inbox");
          break;
        default:
          router.push("/user/request");
      }
    }

    setLoading(false);
  }

  return (
    <LoginView
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      loading={loading}
      err={err}
      onSubmit={handleSubmit}
    />
  );
}
