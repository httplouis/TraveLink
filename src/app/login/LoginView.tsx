"use client";

import * as React from "react";

type Props = {
  loading: boolean;
  err: string | null;
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onMicrosoftLogin: () => void;
  onEmailLogin: () => void;
};

export default function LoginView({
  loading,
  err,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onMicrosoftLogin,
  onEmailLogin,
}: Props) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/pattern-light.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* University Name and Logo - Upper Left, Outside Panel */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/euwhite.png"
          alt="Manuel S. Enverga University Logo"
          className="h-10 w-10 object-contain drop-shadow-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-lg">
          Manuel S. Enverga University
        </h3>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* LEFT: Login Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          {/* Logo and Branding */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/travelink.png"
                alt="Travelink Logo"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <h1 className="text-4xl font-extrabold tracking-tight text-[#7A0010]" style={{
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Travelink
              </h1>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          {/* Error Message */}
          {err && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">Login Failed</p>
                  <p className="text-sm text-red-700">{err}</p>
                </div>
              </div>
            </div>
          )}

          {/* Microsoft Login Button */}
          <button
            type="button"
            onClick={onMicrosoftLogin}
            disabled={loading}
            className="w-full h-12 mb-6 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold shadow-sm transition-all hover:border-[#0078d4] hover:bg-[#0078d4] hover:text-white hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="11" height="11" fill="#F25022" className="group-hover:fill-white transition-colors"/>
                  <rect x="12" y="0" width="11" height="11" fill="#7FBA00" className="group-hover:fill-white transition-colors"/>
                  <rect x="0" y="12" width="11" height="11" fill="#00A4EF" className="group-hover:fill-white transition-colors"/>
                  <rect x="12" y="12" width="11" height="11" fill="#FFB900" className="group-hover:fill-white transition-colors"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="your.email@mseuf.edu.ph"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-10 pr-12 rounded-lg border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none text-sm transition-all"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && email && password) {
                      onEmailLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-[#7A0010] hover:text-[#9A0020] transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="button"
              onClick={onEmailLogin}
              disabled={loading || !email || !password}
              className="w-full h-12 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#9A0020] text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:from-[#8A0010] hover:to-[#AA0020] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-2">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to use your institutional Microsoft account
            </p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <a 
                href="/privacy" 
                className="text-[#7A0010] hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              <span className="text-gray-400">•</span>
              <a 
                href="/terms" 
                className="text-[#7A0010] hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT: Promotional Panel */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#7A0010] via-[#8A0010] to-[#6A0010]">
          {/* Background Image - School Image */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundImage: "url('/pattern-light.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7A0010]/90 via-[#8A0010]/85 to-[#6A0010]/90" />
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white min-h-full">
            <div>
              {/* Main Heading */}
              <h2 className="text-5xl font-extrabold mb-4 leading-tight tracking-tight" style={{
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Welcome to<br />
                <span style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Travelink
                </span>
              </h2>
              
              {/* Description */}
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Smart campus transportation management system for efficient vehicle scheduling and travel coordination.
              </p>

              {/* System Capabilities */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Multi-level approval workflow</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Vehicle & driver assignment</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Smart scheduling & calendar</span>
                </div>
              </div>
            </div>

            {/* QR Code Section for Mobile App */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                    {/* QR Code Placeholder - Replace with actual QR code image */}
                    <div className="text-center p-2">
                      <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm0 4h3v2h-3v-2zm-2-4h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h3v2h-3v-2zm0 4h3v2h-3v-2z"/>
                      </svg>
                      <p className="text-[8px] text-gray-500 mt-1">QR Code</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold mb-1">Download Mobile App</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Scan QR code to download Travelink mobile app for iOS and Android
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
