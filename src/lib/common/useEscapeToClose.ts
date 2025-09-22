// src/lib/common/useEscapeToClose.ts
"use client";
import * as React from "react";
import { isTypingTarget } from "./typingGuard";

export function useEscapeToClose(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}
