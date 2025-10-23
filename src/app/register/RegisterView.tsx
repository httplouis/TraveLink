// app/(auth)/register/RegisterView.tsx
"use client";

import Link from "next/link";
<<<<<<< HEAD
import React, { useEffect } from "react";
import FacultyForm from "./FacultyForm";
import DriverFlow from "./DriverFlow";

=======
import { useState } from "react";

/* ---------- compact input + label ---------- */
export const Input = (props: React.ComponentProps<"input">) => (
  <input
    {...props}
    autoComplete="off"
    className={
      "w-full h-9 border border-gray-300 focus:ring-1 focus:ring-red-900 focus:border-gray-300 " +
      "px-3 rounded-md outline-none text-[13px] shadow-sm text-gray-900 placeholder-gray-500 " +
      (props.className ?? "")
    }
  />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[12px] font-medium text-gray-800 mb-0.5">{children}</label>
);

/* ---------- types ---------- */
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
export type RolePick = "faculty" | "driver";
export type DriverStep = "phone" | "otp" | "profile";

type Props = {
  role: RolePick;
  setRole: (r: RolePick) => void;
  loading: boolean;
  err: string | null;
  msg: string | null;
  onResend?: () => void;

  fFirst: string; setFFirst: (v: string) => void;
  fMiddle: string; setFMiddle: (v: string) => void;
  fLast: string; setFLast: (v: string) => void;
  fSuffix: string; setFSuffix: (v: string) => void;
  fDept: string; setFDept: (v: string) => void;
  fBirthdate: string; setFBirthdate: (v: string) => void;
  fAddress: string; setFAddress: (v: string) => void;
  fEmail: string; setFEmail: (v: string) => void;
  fPw: string; setFPw: (v: string) => void;
  fPwConfirm: string; setFPwConfirm: (v: string) => void;
  onFacultySubmit: (e: React.FormEvent) => void;

  dStep: DriverStep;
  dPhone: string; setDPhone: (v: string) => void;
  dOtp: string; setDOtp: (v: string) => void;
  dFirst: string; setDFirst: (v: string) => void;
  dMiddle: string; setDMiddle: (v: string) => void;
  dLast: string; setDLast: (v: string) => void;
  dSuffix: string; setDSuffix: (v: string) => void;
  dAddress: string; setDAddress: (v: string) => void;
  verifiedPhone: string | null;
  onDriverSendOtp: (e: React.FormEvent) => void;
  onDriverVerify: (e: React.FormEvent) => void;
  onDriverSave: (e: React.FormEvent) => void;
};

<<<<<<< HEAD
export default function RegisterView(props: Props) {
  const { role, setRole } = props;

  // Lock page scroll while this screen is mounted
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    // Exact viewport height + hide overflow
    <div
      className="relative h-svh overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/pattern-light.jpg')" }}
    >
      {/* Light overlay for readability */}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      {/* Optional brand spotlights */}
      <div
        className="pointer-events-none absolute -left-32 -top-24 h-[42rem] w-[42rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #7a1f2a, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-[-14rem] h-[38rem] w-[38rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #a63a4b, transparent)" }}
        aria-hidden="true"
      />

      {/* Content: centers the card vertically, keeps within the viewport */}
      <div className="relative z-10 mx-auto flex h-svh w-full max-w-3xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="rounded-2xl bg-gradient-to-br from-white/60 via-white/20 to-transparent p-[1.5px] shadow-2xl">
            {/* SOLID WHITE CARD (changed from bg-white/85) */}
            <div className="rounded-2xl bg-white backdrop-blur-xl ring-1 ring-black/10">
              <div className="px-6 py-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <img src="/eulogo.png" alt="Enverga University Logo" className="h-10 w-10" />
                  <div>
                    <h1 className="text-[18px] font-extrabold leading-none text-red-900">
                      Enverga University
                    </h1>
                    <p className="text-[11px] text-gray-600">
                      TraviLink · Scheduling & Reservations
                    </p>
                  </div>
                </div>

                <div className="my-4 h-[2px] w-full rounded bg-gradient-to-r from-red-900/70 via-red-900/30 to-transparent" />

                {/* Tabs */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("faculty")}
                    className={`h-10 rounded-md text-[13px] font-medium border transition ${
                      role === "faculty"
                        ? "border-red-900 bg-red-900 text-white shadow"
                        : "border-gray-300/70 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Faculty / Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("driver")}
                    className={`h-10 rounded-md text-[13px] font-medium border transition ${
                      role === "driver"
                        ? "border-red-900 bg-red-900 text-white shadow"
                        : "border-gray-300/70 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Driver
                  </button>
                </div>

                {/* FACULTY */}
                {role === "faculty" && (
                  <FacultyForm
                    loading={props.loading}
                    err={props.err}
                    msg={props.msg}
                    onResend={props.onResend}
                    onSubmit={props.onFacultySubmit}
                    fFirst={props.fFirst} setFFirst={props.setFFirst}
                    fMiddle={props.fMiddle} setFMiddle={props.setFMiddle}
                    fLast={props.fLast} setFLast={props.setFLast}
                    fSuffix={props.fSuffix} setFSuffix={props.setFSuffix}
                    fDept={props.fDept} setFDept={props.setFDept}
                    fBirthdate={props.fBirthdate} setFBirthdate={props.setFBirthdate}
                    fAddress={props.fAddress} setFAddress={props.setFAddress}
                    fEmail={props.fEmail} setFEmail={props.setFEmail}
                    fPw={props.fPw} setFPw={props.setFPw}
                    fPwConfirm={props.fPwConfirm} setFPwConfirm={props.setFPwConfirm}
                  />
                )}

                {/* DRIVER */}
                {role === "driver" && (
                  <DriverFlow
                    loading={props.loading}
                    err={props.err}
                    msg={props.msg}
                    dStep={props.dStep}
                    dPhone={props.dPhone} setDPhone={props.setDPhone}
                    dOtp={props.dOtp} setDOtp={props.setDOtp}
                    dFirst={props.dFirst} setDFirst={props.setDFirst}
                    dMiddle={props.dMiddle} setDMiddle={props.setDMiddle}
                    dLast={props.dLast} setDLast={props.setDLast}
                    dSuffix={props.dSuffix} setDSuffix={props.setDSuffix}
                    dAddress={props.dAddress} setDAddress={props.setDAddress}
                    verifiedPhone={props.verifiedPhone}
                    onDriverSendOtp={props.onDriverSendOtp}
                    onDriverVerify={props.onDriverVerify}
                    onDriverSave={props.onDriverSave}
                  />
                )}

                {/* Login hint under the submit button */}
                <div className="mt-4 text-center text-[13px] text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-[#7a1f2a] hover:underline">
                    Log in
                  </Link>
                </div>
=======
export default function RegisterView({
  role, setRole, loading, err, msg, onResend,
  fFirst, setFFirst, fMiddle, setFMiddle, fLast, setFLast, fSuffix, setFSuffix,
  fDept, setFDept, fBirthdate, setFBirthdate, fAddress, setFAddress,
  fEmail, setFEmail, fPw, setFPw, fPwConfirm, setFPwConfirm, onFacultySubmit,
  dStep, dPhone, setDPhone, dOtp, setDOtp, dFirst, setDFirst, dMiddle, setDMiddle,
  dLast, setDLast, dSuffix, setDSuffix, dAddress, setDAddress,
  verifiedPhone, onDriverSendOtp, onDriverVerify, onDriverSave,
}: Props) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="relative min-h-screen font-sans">
      {/* Background image + overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/pattern-light.jpg')" }}
      />
      <div className="fixed inset-0 z-10 bg-black/40" />

      {/* Content wrapper */}
      <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-black/10">
            <div className="px-6 py-4">
              {/* header */}
              <div className="flex items-center gap-3">
                <img src="/eulogo.png" alt="Enverga University Logo" className="w-9 h-9" />
                <div>
                  <h1 className="text-[16px] font-extrabold text-red-900 leading-none">
                    Enverga University
                  </h1>
                  <p className="text-[10px] text-gray-600">
                    TraviLink · Scheduling & Reservations
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-3" />

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  disabled={loading}
                  className={`rounded-md h-8 text-[12px] font-medium border transition ${
                    role === "faculty"
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Faculty / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  disabled={loading}
                  className={`rounded-md h-8 text-[12px] font-medium border transition ${
                    role === "driver"
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Driver
                </button>
              </div>

              {/* Stage area: keep height stable */}
              <div className="relative w-full min-h-[520px]">
                {/* FACULTY */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${
                    role === "faculty" ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <form onSubmit={onFacultySubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>First name</Label>
                        <Input value={fFirst} onChange={(e) => setFFirst(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Middle name</Label>
                        <Input value={fMiddle} onChange={(e) => setFMiddle(e.target.value)} />
                      </div>
                      <div>
                        <Label>Last name</Label>
                        <Input value={fLast} onChange={(e) => setFLast(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Suffix <span className="text-gray-500">(optional)</span></Label>
                        <Input value={fSuffix} onChange={(e) => setFSuffix(e.target.value)} placeholder="Jr., III, etc." />
                      </div>
                      <div>
                        <Label>Department <span className="text-gray-500">(optional)</span></Label>
                        <Input value={fDept} onChange={(e) => setFDept(e.target.value)} />
                      </div>
                      <div>
                        <Label>Birthdate</Label>
                        <Input type="date" value={fBirthdate} onChange={(e) => setFBirthdate(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
                      </div>

                      {/* password with toggle (only here) */}
                      <div className="relative">
                        <Label>Password</Label>
                        <Input
                          type={showPw ? "text" : "password"}
                          value={fPw}
                          onChange={(e) => setFPw(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-[28px] text-[10px] text-gray-600 hover:text-red-900"
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                        <p className="text-[10px] text-gray-600 mt-0.5">8+ chars, 1 number, 1 symbol.</p>
                      </div>

                      <div>
                        <Label>Confirm Password</Label>
                        <Input type="password" value={fPwConfirm} onChange={(e) => setFPwConfirm(e.target.value)} required />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Address</Label>
                        <Input value={fAddress} onChange={(e) => setFAddress(e.target.value)} required />
                      </div>
                    </div>

                    {err && <p className="text-[12px] text-red-600">{err}</p>}
                    {msg && <p className="text-[12px] text-green-700">{msg}</p>}

                    <button
                      disabled={loading}
                      className="bg-red-900 text-white w-full h-9 rounded-md hover:bg-red-800 transition text-[12px] font-medium shadow-sm disabled:opacity-60"
                    >
                      {loading ? "Creating..." : "Register"}
                    </button>

                    {!!onResend && (
                      <button
                        type="button"
                        onClick={onResend}
                        disabled={loading}
                        className="mt-1 w-full text-center text-[12px] text-red-900 underline disabled:opacity-60"
                      >
                        Resend confirmation
                      </button>
                    )}

                    <p className="text-[11px] text-gray-700 text-center mt-1">
                      Already have an account?{" "}
                      <Link href="/login" className="text-red-900 hover:underline font-medium">
                        Login
                      </Link>
                    </p>
                  </form>
                </div>

                {/* DRIVER */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${
                    role === "driver" ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-800">
                      <span className={`px-2 py-0.5 rounded ${dStep === "phone" ? "bg-gray-200" : ""}`}>1. Phone</span>
                      <span>→</span>
                      <span className={`px-2 py-0.5 rounded ${dStep === "otp" ? "bg-gray-200" : ""}`}>2. Code</span>
                      <span>→</span>
                      <span className={`px-2 py-0.5 rounded ${dStep === "profile" ? "bg-gray-200" : ""}`}>3. Profile</span>
                    </div>

                    {dStep === "phone" && (
                      <form onSubmit={onDriverSendOtp} className="space-y-3">
                        <div>
                          <Label>Phone number</Label>
                          <Input
                            placeholder="09XXXXXXXXX"
                            value={dPhone}
                            onChange={(e) => setDPhone(e.target.value)}
                            required
                          />
                        </div>
                        {err && <p className="text-[12px] text-red-600">{err}</p>}
                        {msg && <p className="text-[12px] text-green-700">{msg}</p>}
                        <button
                          disabled={loading}
                          className="bg-red-900 text-white w-full h-9 rounded-md hover:bg-red-800 transition text-[12px] font-medium shadow-sm disabled:opacity-60"
                        >
                          {loading ? "Sending..." : "Send Code"}
                        </button>
                      </form>
                    )}

                    {dStep === "otp" && (
                      <form onSubmit={onDriverVerify} className="space-y-3">
                        <div>
                          <Label>SMS code</Label>
                          <Input value={dOtp} onChange={(e) => setDOtp(e.target.value)} required />
                        </div>
                        {err && <p className="text-[12px] text-red-600">{err}</p>}
                        {msg && <p className="text-[12px] text-green-700">{msg}</p>}
                        <button
                          disabled={loading}
                          className="bg-red-900 text-white w-full h-9 rounded-md hover:bg-red-800 transition text-[12px] font-medium shadow-sm disabled:opacity-60"
                        >
                          {loading ? "Verifying..." : "Verify"}
                        </button>
                      </form>
                    )}

                    {dStep === "profile" && (
                      <form onSubmit={onDriverSave} className="space-y-3">
                        <p className="text-[12px] text-gray-600">
                          Verified phone: <span className="font-medium">{verifiedPhone ?? "—"}</span>
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>First name</Label>
                            <Input value={dFirst} onChange={(e) => setDFirst(e.target.value)} required />
                          </div>
                          <div>
                            <Label>Middle name</Label>
                            <Input value={dMiddle} onChange={(e) => setDMiddle(e.target.value)} />
                          </div>
                          <div>
                            <Label>Last name</Label>
                            <Input value={dLast} onChange={(e) => setDLast(e.target.value)} required />
                          </div>
                          <div>
                            <Label>Suffix <span className="text-gray-500">(optional)</span></Label>
                            <Input value={dSuffix} onChange={(e) => setDSuffix(e.target.value)} placeholder="Jr., III, etc." />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Address</Label>
                            <Input
                              value={dAddress}
                              onChange={(e) => setDAddress(e.target.value)}
                              placeholder="House No., Street, Barangay, City"
                              required
                            />
                          </div>
                        </div>

                        {err && <p className="text-[12px] text-red-600">{err}</p>}
                        {msg && <p className="text-[12px] text-green-700">{msg}</p>}
                        <button
                          disabled={loading}
                          className="bg-red-900 text-white w-full h-9 rounded-md hover:bg-red-800 transition text-[12px] font-medium shadow-sm disabled:opacity-60"
                        >
                          {loading ? "Saving..." : "Save Profile"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Footer (still visible, but layout stays within viewport) */}
          <p className="mt-2 text-center text-[11px] text-white/85 drop-shadow">
=======
          <p className="mt-2 text-center text-[10px] text-white/90">
>>>>>>> 8dd1516 (Working Registration (Minor tweaks needed))
            © {new Date().getFullYear()} TraviLink · Enverga University
          </p>
        </div>
      </div>
    </div>
  );
}
