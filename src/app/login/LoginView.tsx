"use client";

import Link from "next/link";
import * as React from "react";

type Props = {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  loading: boolean;
  err: string | null;
  onSubmit: (e: React.FormEvent) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
};

export default function LoginView({
  email,
  password,
  setEmail,
  setPassword,
  loading,
  err,
  onSubmit,
  remember,
  setRemember,
}: Props) {
  const [showPw, setShowPw] = React.useState(false);

  return (
    <div className="fixed inset-0 font-sans h-dvh overflow-hidden">
      {/* page background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/pattern-light.jpg"
          alt="Campus background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* container */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-4 sm:p-8">
        <form
  onSubmit={onSubmit}
  className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 rounded-3xl shadow-2xl bg-white overflow-hidden"
>
  {/* LEFT: image panel */}
  <div className="relative hidden md:block overflow-hidden rounded-l-3xl group">
    <img
      src="/pattern-light.jpg"
      alt="Campus"
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-[#7A0010]/70" />

    {/* logo */}
    <div className="absolute right-6 top-6 z-20">
      <img
        src="/euwhite.png"
        alt="EU Logo"
        className="h-10 w-10 object-contain drop-shadow-lg"
      />
    </div>

    {/* overlay text */}
    <div className="absolute bottom-0 left-0 right-0 p-10 text-white z-20">
      <p className="text-sm uppercase tracking-[0.18em] font-semibold opacity-90">
        Welcome to
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl leading-tight font-extrabold">
        TraviLink
      </h1>
      <p className="mt-3 text-base text-white/90">
        Smart Campus Transport System for Everyone
      </p>
    </div>
  </div>
  

          {/* RIGHT: form panel */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-7 sm:p-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#7A0010] mb-6">
              SIGN IN NOW
            </h2>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative group">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v1l-10 6L2 7V6zm0 4.236l9.445 5.667a1 1 0 001.11 0L22 10.236V18a2 2 0 01-2 2H4a2 2 0 01-2-2v-7.764z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mseuf.edu.ph"
                  required
                  className="h-12 w-full rounded-md border border-gray-300 pl-10 pr-3 text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 016 0v3H9z" />
                  </svg>
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 w-full rounded-md border border-gray-300 pl-10 pr-10 text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.707 2.293L2.293 3.707l3.22 3.22C3.66 8.17 2 12 2 12s3 7 10 7c2.107 0 3.9-.54 5.383-1.37l2.91 2.91 1.414-1.414-18-18zM12 17c-2.761 0-5-2.239-5-5 0-.6.109-1.174.304-1.705l6.401 6.401A4.96 4.96 0 0112 17zm7.696-2.295A12.61 12.61 0 0022 12s-3-7-10-7c-1.297 0-2.493.198-3.59.53l1.7 1.7c.61-.13 1.255-.2 1.89-.2 2.761 0 5 2.239 5 5 0 .635-.07 1.28-.2 1.89l1.896 1.896z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* remember / forgot */}
            <div className="mb-6 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  className="accent-[#7A0010]"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link href="/forgot" className="text-sm text-[#7A0010] hover:underline">
                Forgot Password?
              </Link>
            </div>

            {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-md bg-[#7A0010] text-white font-semibold shadow-md transition hover:bg-[#69000d] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="mt-6 text-sm text-gray-700">
              Don’t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#7A0010] hover:underline">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
