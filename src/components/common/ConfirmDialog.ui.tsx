// src/components/common/ConfirmDialog.ui.tsx
"use client";

import * as React from "react";
import clsx from "clsx";

type Props = {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Optional visual tone (defaults to "danger") */
  tone?: "danger" | "info";
  /** Click backdrop to cancel (defaults to true) */
  closeOnBackdrop?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
  tone = "danger",
  closeOnBackdrop = true,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Mount guard
  if (!open) return null;

  // Focus first button on open
  React.useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  // Esc to close, Enter on confirm
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  // Basic focus trap for the two buttons
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const focusables = [cancelBtnRef.current, confirmBtnRef.current].filter(
      Boolean
    ) as HTMLElement[];
    if (focusables.length < 2) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
  }

  const isDanger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={closeOnBackdrop ? onCancel : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={clsx(
          "relative w-[94%] max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10",
          "animate-[fadeIn_.14s_ease-out]"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5">
          <div
            className={clsx(
              "mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full",
              isDanger ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
            )}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M10.29 3.86l-7.5 12.99A2 2 0 004.5 20h15a2 2 0 001.71-3.15l-7.5-12.99a2 2 0 00-3.42 0zM12 9a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0012 17z" />
            </svg>
          </div>
          <div className="min-w-0 pb-2">
            <h3 id="confirm-title" className="text-[15px] font-semibold text-neutral-900">
              {title}
            </h3>
            <div className="mt-1 text-[13px] text-neutral-600">{message}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            ref={cancelBtnRef}
            type="button"
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={clsx(
              "h-9 rounded-md px-3 text-sm text-white",
              isDanger ? "bg-rose-700 hover:bg-rose-800" : "bg-blue-600 hover:bg-blue-700"
            )}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
