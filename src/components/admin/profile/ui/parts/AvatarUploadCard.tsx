"use client";

import * as React from "react";
import { Trash2, Upload } from "lucide-react";
import AvatarPreview from "./AvatarPreview";

type Props = {
  srcUrl?: string | null;
  displayName?: string;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  showPreview?: boolean; // NEW: allow hiding the left circle
};

export default function AvatarUploadCard({
  srcUrl,
  displayName,
  onPick,
  onRemove,
  showPreview = true,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="text-sm font-semibold text-neutral-900">Profile photo</div>

      <div className="mt-3 flex items-center gap-4">
        {showPreview ? (
          <AvatarPreview srcUrl={srcUrl ?? undefined} displayName={displayName} size={72} />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            <Upload className="h-4 w-4" />
            Upload photo
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </div>
    </div>
  );
}
