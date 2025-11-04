// app/(auth)/register/FacultyForm.tsx
"use client";

import * as React from "react";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";

export type FacultyFormProps = {
  loading: boolean;
  err: string | null;
  msg: string | null;
  onResend?: () => void;
  onSubmit: (e: React.FormEvent) => void;

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

  // NEW
  wantsHead?: boolean;
  onWantsHeadChange?: (v: boolean) => void;
  onEmailBlur?: () => void;
  emailCheckLoading?: boolean;
};

export default function FacultyForm(props: FacultyFormProps) {
  const {
    loading, err, msg, onResend, onSubmit,
    fFirst, setFFirst,
    fMiddle, setFMiddle,
    fLast, setFLast,
    fSuffix, setFSuffix,
    fDept, setFDept,
    fBirthdate, setFBirthdate,
    fAddress, setFAddress,
    fEmail, setFEmail,
    fPw, setFPw,
    fPwConfirm, setFPwConfirm,
    wantsHead, onWantsHeadChange,
    onEmailBlur, emailCheckLoading,
  } = props;

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* alerts */}
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}
      {msg && (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <span>{msg}</span>
          {onResend && (
            <button
              type="button"
              onClick={onResend}
              className="text-xs underline hover:opacity-80"
            >
              Resend
            </button>
          )}
        </div>
      )}

      {/* Email FIRST - triggers directory lookup */}
      <label className="grid gap-1">
        <span className="text-xs font-medium text-neutral-700">Email</span>
        <input
          type="email"
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          value={fEmail}
          onChange={(e) => setFEmail(e.target.value)}
          onBlur={onEmailBlur}
          placeholder="you@mseuf.edu.ph"
          required
        />
        {emailCheckLoading && (
          <span className="text-xs text-slate-500">Checking directory...</span>
        )}
      </label>

      {/* Name fields - auto-filled from directory */}
      {fFirst ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-xs text-green-800">
            <strong>✓ Name auto-filled from directory:</strong> {fFirst} {fMiddle} {fLast} {fSuffix}
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">
            <strong>⚠ Enter your institutional email above</strong> to auto-fill your name from the directory.
          </p>
        </div>
      )}

      {/* department */}
      <div className="grid gap-2">
        <DepartmentSelect
          value={fDept}
          onChange={setFDept}
          required
          placeholder="Type to search..."
        />
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-800 leading-tight">
            <strong>Department Head Access:</strong> If you are a department head, your role will be automatically granted when you log in (if your email is in the official roster). No need to request it here.
          </p>
        </div>
      </div>

      {/* password */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Password</span>
          <input
            type="password"
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fPw}
            onChange={(e) => setFPw(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Confirm password</span>
          <input
            type="password"
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fPwConfirm}
            onChange={(e) => setFPwConfirm(e.target.value)}
            required
            minLength={8}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 h-10 rounded-md bg-red-900 px-4 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
