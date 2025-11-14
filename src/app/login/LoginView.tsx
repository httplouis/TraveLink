"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";

type Props = {
  loading: boolean;
  err: string | null;
  onMicrosoftLogin: () => void;
};

export default function LoginView({
  loading,
  err,
  onMicrosoftLogin,
}: Props) {

  return (
    <div className="fixed inset-0 font-sans h-dvh overflow-hidden">
      {/* page background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        {/* Fallback gradient background - image might not load */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* container */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-4 sm:p-8">
        <div
  className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 rounded-3xl shadow-2xl bg-white overflow-hidden"
  suppressHydrationWarning
>
  {/* LEFT: image panel */}
  <div className="relative hidden md:block overflow-hidden rounded-l-3xl group bg-gradient-to-br from-[#7A0010] via-[#8A0010] to-[#6A0010]">
    {/* Gradient background instead of image to avoid loading errors */}
    <div className="absolute inset-0 bg-[#7A0010]/90" />

    {/* logo */}
    <div className="absolute right-6 top-6 z-20">
      <Image
        src="/euwhite.png"
        alt="EU Logo"
        width={40}
        height={40}
        className="drop-shadow-lg"
        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
        priority
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
          <div className="relative bg-white rounded-3xl shadow-2xl p-7 sm:p-10 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#7A0010] mb-2">
              SIGN IN NOW
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Use your institutional Microsoft account to sign in
            </p>

            {err && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border-2 border-red-300 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Azure Provider Not Enabled</p>
                    <p className="text-sm text-red-700 mb-2">{err}</p>
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-xs font-semibold text-red-900 mb-2">Quick Fix:</p>
                      <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                        <li>Go to <strong>Supabase Dashboard</strong> → Your project</li>
                        <li>Click <strong>"Authentication"</strong> → <strong>"Providers"</strong></li>
                        <li>Find <strong>"Azure"</strong> → Toggle <strong>ON</strong></li>
                        <li>Fill in: <strong>Client ID</strong>, <strong>Client Secret</strong>, <strong>Tenant ID</strong></li>
                        <li>Click <strong>"Save"</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Microsoft Login Button */}
            <button
              type="button"
              onClick={onMicrosoftLogin}
              disabled={loading}
              className="h-14 w-full rounded-md bg-white border-2 border-gray-300 text-gray-700 font-semibold shadow-sm transition-all hover:border-[#0078d4] hover:bg-[#0078d4] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              suppressHydrationWarning
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  {/* Microsoft Logo */}
                  <svg className="h-6 w-6" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="11" height="11" fill="#F25022" className="group-hover:fill-white transition-colors"/>
                    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" className="group-hover:fill-white transition-colors"/>
                    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" className="group-hover:fill-white transition-colors"/>
                    <rect x="12" y="12" width="11" height="11" fill="#FFB900" className="group-hover:fill-white transition-colors"/>
                  </svg>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            <p className="mt-6 text-xs text-gray-500 text-center">
              By signing in, you agree to use your institutional Microsoft account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
