// src/components/user/request/ui/parts/EndorsementSection.view.tsx
"use client";

import * as React from "react";
import { Upload, X, CheckCircle, Info, Mail } from "lucide-react";

type Props = {
  nameValue: string;
  dateValue: string;
  onNameChange: (v: string) => void;
  onDateChange: (v: string) => void;

  // new
  isHeadRequester?: boolean;
  currentUserName?: string;
  hasMultipleDepartments?: boolean; // True if request has multiple requesters from different departments

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
  hasMultipleDepartments = false,
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
          {hasMultipleDepartments && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 px-3 py-1.5 w-fit shadow-sm">
              <Info className="h-4 w-4 text-amber-600" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-amber-700">
                Multiple departments detected - Head endorsement invitations will be sent via email to each department's head automatically
              </span>
            </div>
          )}
          {isHeadRequester && !hasMultipleDepartments && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 px-3 py-1.5 w-fit shadow-sm">
              <Info className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-blue-700">You are the department head - you will choose who to send this to</span>
            </div>
          )}
        </div>
      </div>

      {hasMultipleDepartments ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Multiple Departments Detected - Email Invitations Will Be Sent
              </p>
              <p className="text-xs text-blue-700 mb-3">
                This request includes requesters from multiple departments. When you submit this request, the system will:
              </p>
              <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside ml-2">
                <li>Automatically find each department's head from the database</li>
                <li>Send email invitations to each department head (e.g., CENG head will receive an email)</li>
                <li>Each head will receive a confirmation link to review and endorse the request</li>
                <li>You can track the status of each head endorsement after submission</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                <p className="text-xs font-medium text-blue-900">
                  📧 Email invitations will be sent automatically when you click "Submit Request"
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Endorsed by
            </label>
            <input
              type="text"
              value={isHeadRequester ? "" : nameValue}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={!!isHeadRequester}
              className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-200 hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder={isHeadRequester ? "You will choose who to send to" : "Department Head Name"}
            />
            {!nameValue && !isHeadRequester && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ No department head found. Please enter the department head name manually.
              </p>
            )}
            {isHeadRequester && (
              <p className="mt-1 text-xs text-blue-600">
                ℹ️ As department head, you will select the approver when you click "Send to..."
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Endorsement Date
            </label>
            <input
              type="date"
              value={isHeadRequester ? "" : dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={!!isHeadRequester}
              className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-200 hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>
      )}

      {/* Head e-signature – show ALWAYS when head is requester, OR when signature exists */}
      {/* CRITICAL: If isHeadRequester is true, ALWAYS show signature pad (even if no signature yet) */}
      {(isHeadRequester || signature) && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-900">
              {isHeadRequester
                ? "Your E-Signature (as Department Head)"
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
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-neutral-50 hover:shadow">
                  <Upload className="h-4 w-4" />
                  <span>Upload signature image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
                {isHeadRequester && (
                  <p className="text-xs text-blue-700">
                    ℹ️ As the department head, please provide your signature to endorse this request.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}