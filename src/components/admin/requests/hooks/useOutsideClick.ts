// hooks/useOutsideClick.ts
"use client";
import * as React from "react";

export default function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,                     // <-- accept `null` here
  onOutside: (ev: MouseEvent | TouchEvent) => void
) {
  React.useEffect(() => {
    function handler(ev: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (el.contains(ev.target as Node)) return;
      onOutside(ev);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside]);
}
