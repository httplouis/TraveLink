// src/components/user/request/ui/parts/EndorsementSection.view.tsx
"use client";

import * as React from "react";
import { Upload, X, CheckCircle, Info } from "lucide-react";

type Props = {
  nameValue: string;
  dateValue: string;
  onNameChange: (v: string) => void;
  onDateChange: (v: string) => void;

  // new
  isHeadRequester?: boolean;
  currentUserName?: string;

  // head e-signature
  signature?: string | null;
  onSignatureChange?: (dataUrl: string | null) => void;
};

export default function EndorsementSection({
  nameValue,
  dateValue,
  onNameChange,
  onDateChange,
  isHeadRequester,
  currentUserName,
  signature,
  onSignatureChange,
}: Props) {
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!onSignatureChange) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const dataUrl = `data:${file.type};base64,${b64}`;
    onSignatureChange(dataUrl);
    e.target.value = "";
  }

  return (
    <div className="mt-8 space-y-5 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-slate-50/30 to-white p-6 shadow-lg">
      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 tracking-tight">
            Department Head Endorsement
          </h4>
          {isHeadRequester && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 px-3 py-1.5 w-fit shadow-sm">
              <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-green-700">You are the department head - auto-endorsed</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Endorsed by
          </label>
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={!!isHeadRequester}
            className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-200 hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Department Head Name"
          />
          {!nameValue && !isHeadRequester && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ No department head found. Please enter the department head name manually.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Endorsement Date
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-200 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Head e-signature – show only when head is requester OR signature exists */}
      {(isHeadRequester || signature) && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-900">
              {isHeadRequester
                ? "Department Head E-Signature (auto-applied when head submits their own request)"
                : "Department Head E-Signature"}
            </p>
          </div>

          {signature ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <img
                  src={signature}
                  alt="Department head signature"
                  className="h-20 w-full max-w-[240px] object-contain"
                />
              </div>
              {onSignatureChange && (
                <button
                  type="button"
                  onClick={() => onSignatureChange(null)}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove signature
                </button>
              )}
            </div>
          ) : (
            onSignatureChange && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-neutral-50 hover:shadow">
                <Upload className="h-4 w-4" />
                <span>Upload signature image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            )
          )}
        </div>
      )}
    </div>
  );
}