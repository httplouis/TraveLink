// src/components/common/Modal/Modal.tsx
"use client";
import * as React from "react";
import { useEscapeToClose } from "@/lib/common/useEscapeToClose";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number | string;
  ariaLabel?: string;
};

export default function Modal({ open, onClose, children, maxWidth = 760, ariaLabel = "Dialog" }: Props) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop click
      }}
    >
      <div
        className="max-h-[90vh] w-[min(96vw,var(--mw))] overflow-auto rounded-xl bg-white p-4 shadow-xl"
        style={{ ["--mw" as any]: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
