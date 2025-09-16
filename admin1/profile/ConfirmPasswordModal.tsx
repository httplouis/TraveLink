"use client";

import { useEffect, useState } from "react";
import { KeyRound, X, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { BRAND_MAROON } from "@/lib/profile";

export default function ConfirmPasswordModal({
  open,
  onClose,
  onConfirm,
  twoFAEnabled,
  newPassword,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { currentPassword: string; otp?: string }) => Promise<void>;
  twoFAEnabled: boolean;
  newPassword: string;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCur, setShowCur] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setOtp("");
      setSubmitting(false);
      setShowCur(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-neutral-700" />
            <p className="font-semibold">Confirm password change</p>
          </div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid gap-3">
          <div className="text-sm text-neutral-700">
            You are about to update your password to:
            <span className="ml-1 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">
              {"•".repeat(Math.max(8, newPassword.length))}
            </span>
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-neutral-700">Current password</span>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
              <input
                className="w-full outline-none bg-transparent text-sm"
                type={showCur ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoFocus
              />
              <button
                type="button"
                className="p-1 rounded hover:bg-neutral-50"
                onClick={() => setShowCur((s) => !s)}
                aria-label="Toggle current password visibility"
              >
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {twoFAEnabled && (
            <label className="grid gap-1">
              <span className="text-sm text-neutral-700">2FA code</span>
              <input
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none text-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button className="px-3 py-2 rounded-md border hover:bg-neutral-50" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-md text-white inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-neutral-400"
              style={{ background: BRAND_MAROON }}
              onClick={async () => {
                if (currentPassword.length < 1) return;
                if (twoFAEnabled && otp.length !== 6) return;
                setSubmitting(true);
                await onConfirm({ currentPassword, otp: twoFAEnabled ? otp : undefined });
                setSubmitting(false);
              }}
              disabled={submitting || currentPassword.length < 1 || (twoFAEnabled && otp.length !== 6)}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
