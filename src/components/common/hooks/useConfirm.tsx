"use client";
import * as React from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog.ui";

export function useConfirm() {
  const [state, setState] = React.useState<null | {
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    resolve: (v: boolean) => void;
  }>(null);

  const ask = (
    title: string,
    message: string | React.ReactNode,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) =>
    new Promise<boolean>((resolve) =>
      setState({ title, message, confirmText, cancelText, resolve })
    );

  const ui = state ? (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      onCancel={() => {
        state.resolve(false);
        setState(null);
      }}
      onConfirm={() => {
        state.resolve(true);
        setState(null);
      }}
    />
  ) : null;

  return { ask, ui };
}
