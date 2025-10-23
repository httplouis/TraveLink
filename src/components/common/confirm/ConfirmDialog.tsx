"use client";
import * as React from "react";
import { Dialog } from "@headlessui/react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold text-neutral-900">{title}</Dialog.Title>
          <div className="mt-2 text-sm text-neutral-700">{message}</div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button className="h-9 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-700 hover:bg-neutral-50" onClick={onCancel}>{cancelLabel}</button>
            <button className="h-9 rounded-lg bg-[#7a1f2a] px-4 text-sm font-medium text-white hover:brightness-110" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
