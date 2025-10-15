// src/components/auth/register/DriverFlow.tsx
"use client";

import * as React from "react";
import { Input, Label } from "./atoms";

type Step = "phone" | "otp" | "profile";

type Props = {
  loading: boolean;
  err: string | null;
  msg: string | null;

  dStep: Step;
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

export default function DriverFlow(p: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-800">
        <span className={`rounded px-2 py-1 ${p.dStep === "phone" ? "bg-gray-200" : ""}`}>1. Phone</span>
        <span>→</span>
        <span className={`rounded px-2 py-1 ${p.dStep === "otp" ? "bg-gray-200" : ""}`}>2. Code</span>
        <span>→</span>
        <span className={`rounded px-2 py-1 ${p.dStep === "profile" ? "bg-gray-200" : ""}`}>3. Profile</span>
      </div>

      {p.dStep === "phone" && (
        <form onSubmit={p.onDriverSendOtp} className="space-y-3">
          <div>
            <Label>Phone number</Label>
            <Input placeholder="09XXXXXXXXX" value={p.dPhone} onChange={(e) => p.setDPhone(e.target.value)} required />
          </div>
          {p.err && <p className="text-[13px] text-red-600">{p.err}</p>}
          {p.msg && <p className="text-[13px] text-green-700">{p.msg}</p>}
          <button
            disabled={p.loading}
            className="h-10 w-full rounded-md bg-red-900 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-red-800 disabled:opacity-60"
          >
            {p.loading ? "Sending..." : "Send Code"}
          </button>
        </form>
      )}

      {p.dStep === "otp" && (
        <form onSubmit={p.onDriverVerify} className="space-y-3">
          <div>
            <Label>SMS code</Label>
            <Input value={p.dOtp} onChange={(e) => p.setDOtp(e.target.value)} required />
          </div>
          {p.err && <p className="text-[13px] text-red-600">{p.err}</p>}
          {p.msg && <p className="text-[13px] text-green-700">{p.msg}</p>}
          <button
            disabled={p.loading}
            className="h-10 w-full rounded-md bg-red-900 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-red-800 disabled:opacity-60"
          >
            {p.loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      )}

      {p.dStep === "profile" && (
        <form onSubmit={p.onDriverSave} className="space-y-3">
          <p className="text-[12px] text-gray-600">
            Verified phone: <span className="font-medium">{p.verifiedPhone ?? "—"}</span>
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>First name</Label>
              <Input value={p.dFirst} onChange={(e) => p.setDFirst(e.target.value)} required />
            </div>
            <div>
              <Label>Middle name</Label>
              <Input value={p.dMiddle} onChange={(e) => p.setDMiddle(e.target.value)} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={p.dLast} onChange={(e) => p.setDLast(e.target.value)} required />
            </div>
            <div>
              <Label>Suffix</Label>
              <Input value={p.dSuffix} onChange={(e) => p.setDSuffix(e.target.value)} placeholder="Jr., III, etc." />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                value={p.dAddress}
                onChange={(e) => p.setDAddress(e.target.value)}
                placeholder="House No., Street, Barangay, City"
                required
              />
            </div>
          </div>
          {p.err && <p className="text-[13px] text-red-600">{p.err}</p>}
          {p.msg && <p className="text-[13px] text-green-700">{p.msg}</p>}
          <button
            disabled={p.loading}
            className="h-10 w-full rounded-md bg-red-900 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-red-800 disabled:opacity-60"
          >
            {p.loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
