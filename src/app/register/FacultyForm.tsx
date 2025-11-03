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

      {/* name */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">First name</span>
          <input
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fFirst}
            onChange={(e) => setFFirst(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Middle name</span>
          <input
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fMiddle}
            onChange={(e) => setFMiddle(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Last name</span>
          <input
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fLast}
            onChange={(e) => setFLast(e.target.value)}
            required
          />
        </label>
      </div>

      {/* suffix + birthdate */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Suffix</span>
          <input
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder="Jr., II, etc."
            value={fSuffix}
            onChange={(e) => setFSuffix(e.target.value)}
          />
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium text-neutral-700">Birthdate</span>
          <input
            type="date"
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            value={fBirthdate}
            onChange={(e) => setFBirthdate(e.target.value)}
            required
          />
        </label>
      </div>

      {/* department */}
      <div className="grid gap-2">
        <DepartmentSelect
          value={fDept}
          onChange={setFDept}
          required
          placeholder="Type to search..."
        />
        {/* checkbox for “I am the head” */}
        <label className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <input
            type="checkbox"
            checked={wantsHead ?? false}
            onChange={(e) => onWantsHeadChange?.(e.target.checked)}
            className="mt-[2px] h-4 w-4 rounded border-neutral-300 text-red-900"
          />
          <span className="text-xs text-neutral-700 leading-tight">
            I am the Department / Office Head of the selected unit. Please flag this account for head privileges.
            <span className="block text-[10px] text-neutral-500">
              (Admin will still verify this. If not approved, you stay as regular faculty.)
            </span>
          </span>
        </label>
      </div>

      {/* address */}
      <label className="grid gap-1">
        <span className="text-xs font-medium text-neutral-700">Address</span>
        <input
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          value={fAddress}
          onChange={(e) => setFAddress(e.target.value)}
          required
        />
      </label>

      {/* email + password */}
      <label className="grid gap-1">
        <span className="text-xs font-medium text-neutral-700">Email</span>
        <input
          type="email"
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          value={fEmail}
          onChange={(e) => setFEmail(e.target.value)}
          placeholder="you@mseuf.edu.ph"
          required
        />
      </label>
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
