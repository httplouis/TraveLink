// app/(auth)/register/RegisterView.tsx
"use client";

import Link from "next/link";
import React from "react";
import FacultyForm from "./FacultyForm";
import DriverFlow from "./DriverFlow";


/** Keep the same prop contract your container/page already uses */
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

export default function RegisterView(props: Props) {
  const { role, setRole } = props;

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-neutral-100" />
      <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/enverga-bg.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="rounded-xl bg-white/95 shadow-xl ring-1 ring-black/10 backdrop-blur-sm">
            <div className="px-6 py-6 lg:px-8">
              {/* Header */}
              <div className="flex items-center gap-3">
                <img src="/eulogo.png" alt="Enverga University Logo" className="h-10 w-10" />
                <div>
                  <h1 className="text-[18px] font-extrabold leading-none text-red-900">
                    Enverga University
                  </h1>
                  <p className="text-[11px] text-gray-600">TraviLink · Scheduling & Reservations</p>
                </div>
              </div>

              <div className="my-4 h-px bg-gray-200" />

              {/* Tabs */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={`h-10 rounded-md text-[13px] font-medium border transition ${
                    role === "faculty"
                      ? "border-red-900 bg-red-900 text-white"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Faculty / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`h-10 rounded-md text-[13px] font-medium border transition ${
                    role === "driver"
                      ? "border-red-900 bg-red-900 text-white"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
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
