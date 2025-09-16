// app/(auth)/register/RegisterView.tsx
"use client";

import Link from "next/link";
import React from "react";

/* UI atoms */
export const Input = (props: React.ComponentProps<"input">) => (
  <input
    {...props}
    autoComplete="off"
    className={
      "w-full h-10 border border-gray-300 focus:ring-2 focus:ring-red-900 focus:border-red-900 " +
      "px-3 rounded-md outline-none text-[13px] shadow-sm text-gray-900 placeholder-gray-500 " +
      (props.className ?? "")
    }
  />
);

export const Select = (props: React.ComponentProps<"select">) => (
  <select
    {...props}
    className={
      "w-full h-10 border border-gray-300 focus:ring-2 focus:ring-red-900 focus:border-red-900 " +
      "px-3 rounded-md outline-none text-[13px] shadow-sm text-gray-900 " +
      (props.className ?? "")
    }
  />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[12px] font-medium text-gray-800 mb-1">{children}</label>
);

/* Departments (Lucena) */
const DEPARTMENTS = [
  "College of Computing and Multimedia Studies (CCMS)",
  "College of Criminal Justice and Criminology (CCJC)",
  "College of Nursing and Allied Health Sciences (CNAHS)",
  "College of International Hospitality and Tourism Management (CIHTM)",
  "College of Architecture and Fine Arts (CAFA)",
  "College of Maritime Education (CME)",
  "College of Business and Accountancy (CBA)",
  "College of Arts and Sciences (CAS)",
  "College of Education (CED)",
  "College of Engineering (CENG)",
  "Enverga Law School (ELS)",
  "Institute of Graduate Studies and Research (IGSR)",
  "Basic Education Department (BED)",
  "Treasury Office",
  "Alumni Affairs Office",
  "Registrar",
  "Human Resources",
  "Finance Office",
];

/* Types */
export type RolePick = "faculty" | "driver";
export type DriverStep = "phone" | "otp" | "profile";

type Props = {
  role: RolePick;
  setRole: (r: RolePick) => void;
  loading: boolean;
  err: string | null;
  msg: string | null;
  onResend?: () => void;

  fFirst: string;
  setFFirst: (v: string) => void;
  fMiddle: string;
  setFMiddle: (v: string) => void;
  fLast: string;
  setFLast: (v: string) => void;
  fSuffix: string;
  setFSuffix: (v: string) => void;
  fDept: string;
  setFDept: (v: string) => void;
  fBirthdate: string;
  setFBirthdate: (v: string) => void;
  fAddress: string;
  setFAddress: (v: string) => void;
  fEmail: string;
  setFEmail: (v: string) => void;
  fPw: string;
  setFPw: (v: string) => void;
  fPwConfirm: string;
  setFPwConfirm: (v: string) => void;
  onFacultySubmit: (e: React.FormEvent) => void;

  dStep: DriverStep;
  dPhone: string;
  setDPhone: (v: string) => void;
  dOtp: string;
  setDOtp: (v: string) => void;
  dFirst: string;
  setDFirst: (v: string) => void;
  dMiddle: string;
  setDMiddle: (v: string) => void;
  dLast: string;
  setDLast: (v: string) => void;
  dSuffix: string;
  setDSuffix: (v: string) => void;
  dAddress: string;
  setDAddress: (v: string) => void;
  verifiedPhone: string | null;
  onDriverSendOtp: (e: React.FormEvent) => void;
  onDriverVerify: (e: React.FormEvent) => void;
  onDriverSave: (e: React.FormEvent) => void;
};

export default function RegisterView({
  role,
  setRole,
  loading,
  err,
  msg,
  onResend,
  fFirst,
  setFFirst,
  fMiddle,
  setFMiddle,
  fLast,
  setFLast,
  fSuffix,
  setFSuffix,
  fDept,
  setFDept,
  fBirthdate,
  setFBirthdate,
  fAddress,
  setFAddress,
  fEmail,
  setFEmail,
  fPw,
  setFPw,
  fPwConfirm,
  setFPwConfirm,
  onFacultySubmit,
  dStep,
  dPhone,
  setDPhone,
  dOtp,
  setDOtp,
  dFirst,
  setDFirst,
  dMiddle,
  setDMiddle,
  dLast,
  setDLast,
  dSuffix,
  setDSuffix,
  dAddress,
  setDAddress,
  verifiedPhone,
  onDriverSendOtp,
  onDriverVerify,
  onDriverSave,
}: Props) {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-neutral-100" />
      <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/enverga-bg.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ring-1 ring-black/10">
            <div className="px-6 lg:px-8 py-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <img src="/eulogo.png" alt="Enverga University Logo" className="w-10 h-10" />
                <div>
                  <h1 className="text-[18px] font-extrabold text-red-900 leading-none">Enverga University</h1>
                  <p className="text-[11px] text-gray-600">TraviLink · Scheduling & Reservations</p>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-4" />

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={`rounded-md h-10 text-[13px] font-medium border transition ${
                    role === "faculty"
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Faculty / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`rounded-md h-10 text-[13px] font-medium border transition ${
                    role === "driver"
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Driver
                </button>
              </div>

              {/* FACULTY FORM */}
              {role === "faculty" && (
                <form onSubmit={onFacultySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Names */}
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
                      <Label>Suffix</Label>
                      <Input value={fSuffix} onChange={(e) => setFSuffix(e.target.value)} placeholder="Jr., III, etc." />
                    </div>

                    {/* Dept + Birthdate */}
                    <div>
                      <Label>Department</Label>
                      <Select value={fDept} onChange={(e) => setFDept(e.target.value)} required>
                        <option value="" disabled>
                          Select a department
                        </option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Birthdate</Label>
                      <Input type="date" value={fBirthdate} onChange={(e) => setFBirthdate(e.target.value)} required />
                    </div>

                    {/* Email full width */}
                    <div className="md:col-span-2">
                      <Label>Email</Label>
                      <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
                    </div>

                    {/* Passwords side-by-side */}
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={fPw} onChange={(e) => setFPw(e.target.value)} required />
                      <p className="text-[10px] text-gray-600 mt-1">8+ chars, 1 number, 1 symbol.</p>
                    </div>
                    <div>
                      <Label>Confirm Password</Label>
                      <Input type="password" value={fPwConfirm} onChange={(e) => setFPwConfirm(e.target.value)} required />
                    </div>

                    {/* Address full width */}
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input value={fAddress} onChange={(e) => setFAddress(e.target.value)} required />
                    </div>
                  </div>

                  {/* Messages */}
                  {err && <p className="text-[13px] text-red-600">{err}</p>}
                  {msg && <p className="text-[13px] text-green-700">{msg}</p>}

                  {/* Actions */}
                  <button
                    disabled={loading}
                    className="bg-red-900 text-white w-full h-10 rounded-md hover:bg-red-800 transition-all text-[13px] font-medium shadow-sm disabled:opacity-60"
                  >
                    {loading ? "Creating..." : "Register"}
                  </button>

                  {!!onResend && (
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={loading}
                      className="mt-2 w-full text-center text-[13px] text-red-900 underline disabled:opacity-60"
                    >
                      Resend confirmation
                    </button>
                  )}

                  <p className="text-[12px] text-gray-700 text-center mt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-red-900 hover:underline font-medium">
                      Login
                    </Link>
                  </p>
                </form>
              )}

              {/* DRIVER FLOW */}
              {role === "driver" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-[11px] text-gray-800">
                    <span className={`px-2 py-1 rounded ${dStep === "phone" ? "bg-gray-200" : ""}`}>1. Phone</span>
                    <span>→</span>
                    <span className={`px-2 py-1 rounded ${dStep === "otp" ? "bg-gray-200" : ""}`}>2. Code</span>
                    <span>→</span>
                    <span className={`px-2 py-1 rounded ${dStep === "profile" ? "bg-gray-200" : ""}`}>3. Profile</span>
                  </div>

                  {dStep === "phone" && (
                    <form onSubmit={onDriverSendOtp} className="space-y-3">
                      <div>
                        <Label>Phone number</Label>
                        <Input placeholder="09XXXXXXXXX" value={dPhone} onChange={(e) => setDPhone(e.target.value)} required />
                      </div>
                      {err && <p className="text-[13px] text-red-600">{err}</p>}
                      {msg && <p className="text-[13px] text-green-700">{msg}</p>}
                      <button
                        disabled={loading}
                        className="bg-red-900 text-white w-full h-10 rounded-md hover:bg-red-800 transition-all text-[13px] font-medium shadow-sm disabled:opacity-60"
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
                      {err && <p className="text-[13px] text-red-600">{err}</p>}
                      {msg && <p className="text-[13px] text-green-700">{msg}</p>}
                      <button
                        disabled={loading}
                        className="bg-red-900 text-white w-full h-10 rounded-md hover:bg-red-800 transition-all text-[13px] font-medium shadow-sm disabled:opacity-60"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label>Suffix</Label>
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
                      {err && <p className="text-[13px] text-red-600">{err}</p>}
                      {msg && <p className="text-[13px] text-green-700">{msg}</p>}
                      <button
                        disabled={loading}
                        className="bg-red-900 text-white w-full h-10 rounded-md hover:bg-red-800 transition-all text-[13px] font-medium shadow-sm disabled:opacity-60"
                      >
                        {loading ? "Saving..." : "Save Profile"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-white/80">
            © {new Date().getFullYear()} TraviLink · Enverga University
          </p>
        </div>
      </div>
    </div>
  );
}
