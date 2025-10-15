"use client";
import * as React from "react";
import { isTypingTarget } from "./typingGuard";

type Hotkey = {
  key: string;               // "a", "x", "ArrowLeft", "Enter"
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;             // support Alt combos (e.g., Alt+N)
  handler: (e: KeyboardEvent) => void;
};

type Options = { ignoreWhileTyping?: boolean };

export function useHotkeys(hotkeys: Hotkey[], opts?: Options) {
  const hkRef = React.useRef<Hotkey[]>(hotkeys);
  const optRef = React.useRef<Options | undefined>(opts);

  React.useEffect(() => { hkRef.current = hotkeys; }, [hotkeys]);
  React.useEffect(() => { optRef.current = opts; }, [opts]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const hotkeys = hkRef.current;
      const options = optRef.current;

      if ((e as any).isComposing) return;
      if (e.key === "Control" || e.key === "Meta" || e.key === "Shift" || e.key === "Alt") return;

      const targetIsTyping = isTypingTarget(e.target);
      // While typing, allow only Ctrl/Meta/Alt modified combos to pass
      if (options?.ignoreWhileTyping && targetIsTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        return;
      }

      for (const hk of hotkeys) {
        const pressed = e.key;
        const matchKey =
          pressed === hk.key ||
          pressed.toLowerCase() === hk.key.toLowerCase(); // letters

        if (!matchKey) continue;
        if (hk.ctrl && !e.ctrlKey) continue;
        if (hk.meta && !e.metaKey) continue;
        if (hk.shift && !e.shiftKey) continue;
        if (hk.alt && !e.altKey) continue;

        e.preventDefault(); // run before default behaviors (e.g., form submit)
        hk.handler(e);
        break;
      }
    };

    // Capture to beat default browser behaviors when possible
    document.addEventListener("keydown", onKey, { capture: true });
    return () => {
      document.removeEventListener("keydown", onKey, { capture: true } as any);
    };
  }, []);
}
