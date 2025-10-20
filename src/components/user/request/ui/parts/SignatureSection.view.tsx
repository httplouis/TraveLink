"use client";

import * as React from "react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { UI_TEXT } from "@/lib/user/request/uiText";

type Props = {
  signature: string | null;
  sigDirty: boolean;                 // keep if you still need it elsewhere
  sigSaved: boolean;
  sigSavedAt: string | null;
  errors: Record<string, string>;
  onSigDraw: () => void;
  onSigSave: (dataUrl: string) => void;      // autosave calls this
  onSigClear: () => void;
  onSigUpload: (file: File) => void | Promise<void>;
};

export default function SignatureSection({
  signature,
  sigDirty,
  sigSaved,
  sigSavedAt,
  errors,
  onSigDraw,
  onSigSave,
  onSigClear,
  onSigUpload,
}: Props) {
  return (
    <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      {/* label + right-aligned status */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">
          {UI_TEXT.signature.title}
        </span>

        {errors["travelOrder.endorsedByHeadSignature"] && !signature ? (
          <span className="text-xs font-semibold text-red-600">
            {errors["travelOrder.endorsedByHeadSignature"]}
          </span>
        ) : sigSaved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            ✓ Saved
            {sigSavedAt ? <span className="text-green-700/80"> · {sigSavedAt}</span> : null}
          </span>
        ) : (
          <span className="text-xs text-neutral-500">{UI_TEXT.signature.notSaved}</span>
        )}
      </div>

      <SignaturePad
        height={200}
        value={signature}
        onDraw={onSigDraw}
        onSave={onSigSave}           // autosave on pointerup + after upload
        onClear={onSigClear}
        onUpload={onSigUpload}
        hideSaveButton               // ⬅️ remove manual Save button
        saveDisabled                 // (button hidden anyway; keeps API parity)
      />
    </div>
  );
}
