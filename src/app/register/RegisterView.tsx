// app/(auth)/register/RegisterView.tsx
"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import FacultyForm from "./FacultyForm";
import DriverFlow from "./DriverFlow";

export type RolePick = "faculty" | "driver";
export type DriverStep = "phone" | "otp" | "profile";

type Props = {
  role: RolePick;
  setRole: (r: RolePick) => void;
  loading: boolean;
  err: string | null;
  msg: string | null;
  onResend?: () => void;

  // faculty
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
  onEmailBlur?: () => void;
  emailCheckLoading?: boolean;

  // driver
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

  // lock scroll (same as dati)
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
    <div
      className="relative h-svh overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/pattern-light.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
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

      <div className="relative z-10 mx-auto flex h-svh w-full max-w-3xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="rounded-2xl bg-gradient-to-br from-white/60 via-white/20 to-transparent p-[1.5px] shadow-2xl">
            <div className="rounded-2xl bg-white backdrop-blur-xl ring-1 ring-black/10">
              <div className="px-6 py-6 lg:px-8">
                {/* header */}
                <div className="flex items-center gap-3">
                  <img src="/eulogo.png" alt="Enverga University Logo" className="h-10 w-10" />
                  <div>
                    <h1 className="text-[18px] font-extrabold leading-none text-red-900">
                      Enverga University
                    </h1>
                    <p className="text-[11px] text-gray-600">
                      Travelink · Scheduling & Reservations
                    </p>
                  </div>
                </div>

                <div className="my-4 h-[2px] w-full rounded bg-gradient-to-r from-red-900/70 via-red-900/30 to-transparent" />

                {/* tabs */}
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

                {role === "faculty" && (
                  <FacultyForm
                    loading={props.loading}
                    err={props.err}
                    msg={props.msg}
                    onResend={props.onResend}
                    onSubmit={props.onFacultySubmit}
                    fFirst={props.fFirst}
                    setFFirst={props.setFFirst}
                    fMiddle={props.fMiddle}
                    setFMiddle={props.setFMiddle}
                    fLast={props.fLast}
                    setFLast={props.setFLast}
                    fSuffix={props.fSuffix}
                    setFSuffix={props.setFSuffix}
                    fDept={props.fDept}
                    setFDept={props.setFDept}
                    fBirthdate={props.fBirthdate}
                    setFBirthdate={props.setFBirthdate}
                    fAddress={props.fAddress}
                    setFAddress={props.setFAddress}
                    fEmail={props.fEmail}
                    setFEmail={props.setFEmail}
                    fPw={props.fPw}
                    setFPw={props.setFPw}
                    fPwConfirm={props.fPwConfirm}
                    setFPwConfirm={props.setFPwConfirm}
                    onEmailBlur={props.onEmailBlur}
                    emailCheckLoading={props.emailCheckLoading}
                  />
                )}

                {role === "driver" && (
                  <DriverFlow
                    loading={props.loading}
                    err={props.err}
                    msg={props.msg}
                    dStep={props.dStep}
                    dPhone={props.dPhone}
                    setDPhone={props.setDPhone}
                    dOtp={props.dOtp}
                    setDOtp={props.setDOtp}
                    dFirst={props.dFirst}
                    setDFirst={props.setDFirst}
                    dMiddle={props.dMiddle}
                    setDMiddle={props.setDMiddle}
                    dLast={props.dLast}
                    setDLast={props.setDLast}
                    dSuffix={props.dSuffix}
                    setDSuffix={props.setDSuffix}
                    dAddress={props.dAddress}
                    setDAddress={props.setDAddress}
                    verifiedPhone={props.verifiedPhone}
                    onDriverSendOtp={props.onDriverSendOtp}
                    onDriverVerify={props.onDriverVerify}
                    onDriverSave={props.onDriverSave}
                  />
                )}

                <div className="mt-4 text-center text-[13px] text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-[#7a1f2a] hover:underline">
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] text-white/85 drop-shadow">
            © {new Date().getFullYear()} Travelink · Enverga University
          </p>
        </div>
      </div>
    </div>
  );
}
