// src/components/user/request/ui/parts/EndorsementSection.view.tsx
"use client";

import * as React from "react";

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
    <div className="mt-6 space-y-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4">
      <p className="text-sm font-semibold text-neutral-700">
        Department Head Endorsement
        {isHeadRequester ? " (head is the requester)" : ""}
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Endorsed by
          </label>
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={!!isHeadRequester}
            className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
            placeholder="Department Head"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Date
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
          />
        </div>
      </div>

      {/* Head e-signature – show only when head is requester OR may signature na */}
      {(isHeadRequester || signature) && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Head e-signature (auto kapag si Head mismo ang nag-request)
          </p>

          {signature ? (
            <div className="flex items-center gap-3">
              <img
                src={signature}
                alt="Head signature"
                className="h-16 max-w-[180px] rounded-md border border-neutral-200 bg-white object-contain"
              />
              {onSignatureChange ? (
                <button
                    type="button"
                    onClick={() => onSignatureChange(null)}
                    className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}

          {onSignatureChange ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50">
              <span>Upload signature image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          ) : null}
        </div>
      )}
    </div>
  );
}
  