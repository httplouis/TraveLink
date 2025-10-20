"use client";

import * as React from "react";
import Image from "next/image";
import { User } from "lucide-react";

type Props = {
  srcUrl?: string | null;
  displayName?: string;
  size?: number; // px
};

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function isValidSrc(src?: string | null) {
  if (!src) return false;
  return /^(blob:|data:|https?:\/\/|\/)/.test(src);
}

export default function AvatarPreview({ srcUrl, displayName, size = 64 }: Props) {
  const box = { width: `${size}px`, height: `${size}px` };
  const hasSrc = isValidSrc(srcUrl);

  return (
    <div
      className="relative overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200"
      style={box}
      aria-label="Profile photo"
    >
      {hasSrc ? (
        <Image src={srcUrl as string} alt="" fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100" />
            <span className="relative z-10 text-base font-semibold text-neutral-600">
              {initials(displayName)}
            </span>
            <User className="absolute h-5 w-5 text-neutral-300" />
          </div>
        </div>
      )}
    </div>
  );
}
