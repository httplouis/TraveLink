// components/common/Modal.ui.tsx
"use client";
import * as React from "react";
export function Modal({
  open, title, onClose, children, maxWidth="max-w-2xl",
}: {
  open: boolean; title: string; onClose: ()=>void; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow hover:bg-red-700">
            Close
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
