"use client";
import * as React from "react";

export default function AttachmentLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/80 grid place-items-center" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl" />
    </div>
  );
}
