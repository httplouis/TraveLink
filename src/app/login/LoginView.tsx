"use client";

import * as React from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type Props = {
  microsoftLoading: boolean;
  emailLoading: boolean;
  err: string | null;
  email: string;
  password: string;
  rememberMe: boolean;
  showForgotPassword: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRememberMeChange: (remember: boolean) => void;
  onMicrosoftLogin: () => void;
  onEmailLogin: () => void;
};

export default function LoginView({
  microsoftLoading,
  emailLoading,
  err,
  email,
  password,
  rememberMe,
  showForgotPassword,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onMicrosoftLogin,
  onEmailLogin,
}: Props) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = React.useState(false);

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
      <div className="absolute top-6 left-6 z-20">
        <div className="logo flex items-center gap-5">
          {/* Circular Seal Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eulogo.png"
            alt="Logo"
            className="h-24 w-24 object-contain drop-shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* University Name - Matching Official HTML Structure */}
          <p className="notranslate text-white drop-shadow-lg leading-none" style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '0.03em',
            fontWeight: 900,
            fontSize: '2.5rem',
            lineHeight: '1'
          }}>
            <span style={{ fontSize: '3rem' }}>ENVERGA</span><br />UNIVERSITY
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* LEFT: Login Form */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-white max-w-md mx-auto w-full">
          {/* Logo and Branding */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/travelink.png"
                alt="Travelink Logo"
                className="h-14 w-14 object-contain"
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-base text-gray-600">Sign in to access your account</p>
          </div>

          {/* Error Message */}
          {err && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800 mb-0.5">Login Failed</p>
                  <p className="text-xs text-red-700">{err}</p>
                </div>
              </div>
            </div>
          )}

          {/* Microsoft Login Button */}
          <button
            type="button"
            onClick={onMicrosoftLogin}
            disabled={microsoftLoading || emailLoading}
            className="w-full h-14 mb-4 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold shadow-sm transition-all hover:border-[#0078d4] hover:bg-[#0078d4] hover:text-white hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-base"
          >
            {microsoftLoading ? (
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
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div className="space-y-3.5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                  className="w-full h-14 pl-10 pr-4 rounded-lg border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none text-base transition-all"
                  disabled={microsoftLoading || emailLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                  className="w-full h-14 pl-10 pr-12 rounded-lg border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none text-base transition-all"
                  disabled={microsoftLoading || emailLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !microsoftLoading && !emailLoading && email && password) {
                      onEmailLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  checked={rememberMe}
                  onChange={(e) => onRememberMeChange(e.target.checked)}
                  className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                />
                <span className="ml-2 text-xs text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className={`text-xs font-semibold text-[#7A0010] hover:text-[#9A0020] transition-colors ${
                  showForgotPassword ? 'underline animate-pulse' : ''
                }`}
              >
                Forgot password?
              </button>
            </div>
            
            {showForgotPassword && !showForgotPasswordModal && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Having trouble logging in?</strong> You can reset your password by clicking "Forgot password?" above.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onEmailLogin}
              disabled={microsoftLoading || emailLoading || !email || !password}
              className="w-full h-14 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#9A0020] text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:from-[#8A0010] hover:to-[#AA0020] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {emailLoading ? (
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
          <div className="mt-6 space-y-1.5">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to use your institutional Microsoft account
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
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
          <div className="relative z-10 flex flex-col justify-between p-8 lg:p-10 text-white min-h-full">
            <div>
              {/* Main Heading */}
              <h2 className="text-4xl font-extrabold mb-3 leading-tight tracking-tight" style={{
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
              <p className="text-base text-white/90 mb-6 leading-relaxed">
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
            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 overflow-hidden">
              {/* MSEUF Logo Background - Positioned to the side, light/opaque */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-80 opacity-15"
                style={{
                  backgroundImage: "url('/euwhite.png')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'right center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'brightness(0) invert(1)'
                }}
              />
              
              <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Large QR Code */}
                <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center shadow-lg p-3">
                  {/* QR Code Placeholder - Replace with actual QR code image */}
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-full h-full text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm0 4h3v2h-3v-2zm-2-4h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h3v2h-3v-2zm0 4h3v2h-3v-2z"/>
                    </svg>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="text-center">
                  <p className="text-xl font-bold mb-2 text-white">Download Mobile App</p>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Scan QR code to download Travelink mobile app for iOS and Android
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const resetEmail = formData.get('email') as string;
                
                try {
                  const supabase = createSupabaseClient();
                  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });

                  if (error) throw error;

                  alert('Password reset email sent! Please check your inbox.');
                  setShowForgotPasswordModal(false);
                } catch (error: any) {
                  alert(error.message || 'Failed to send reset email. Please contact IT support.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                  <input
                  id="reset-email"
                  type="email"
                  name="email"
                  defaultValue={email}
                  required
                  placeholder="your.email@mseuf.edu.ph"
                  className="w-full h-10 px-4 rounded-lg border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none text-sm transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 h-10 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#9A0020] text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:from-[#8A0010] hover:to-[#AA0020] text-sm"
                >
                  Send Reset Link
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact IT Support at{' '}
                <a href="mailto:it@mseuf.edu.ph" className="text-[#7A0010] hover:underline">
                  it@mseuf.edu.ph
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
