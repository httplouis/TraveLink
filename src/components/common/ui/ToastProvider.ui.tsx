// src/components/common/ui/ToastProvider.ui.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Toast = {
  id: string;
  kind?: "success" | "error" | "info";
  title?: string;
  message: string;
  timeoutMs?: number;
};

type Ctx = (t: Omit<Toast, "id">) => void;
const ToastCtx = React.createContext<Ctx>(() => {});

export function useToast(): Ctx {
  return React.useContext(ToastCtx);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => setMounted(true), []);

  const push: Ctx = React.useCallback((t) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, timeoutMs: 3500, kind: "info", ...t };
    setToasts((list) => [...list, toast]);
    const ms = toast.timeoutMs!;
    const timer = setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
    }, ms);
    return () => clearTimeout(timer);
  }, []);

  const clearOne = (id: string) => setToasts((l) => l.filter((x) => x.id !== id));

  // Don’t render anything on the server — avoids hydration mismatch.
  if (!mounted) return <>{children}</>;

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div
          // sits ABOVE your z-50 TopBar and also clears it vertically
          className="
            fixed right-3 z-[1000]
            flex w-[min(480px,95vw)] flex-col gap-2
            pointer-events-none
          "
          // if --topbar-h is available we respect it; otherwise default to 56px
          style={{ top: `calc(var(--topbar-h, 56px) + 12px)` }}
        >
          {toasts.map((t) => (
            <article
              key={t.id}
              className={[
                "pointer-events-auto rounded-xl border px-4 py-3 shadow-lg",
                t.kind === "success" && "border-green-200 bg-green-50 text-green-900",
                t.kind === "error" && "border-red-200 bg-red-50 text-red-900",
                t.kind === "info" && "border-neutral-200 bg-white text-neutral-900",
              ].join(" ")}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {t.title && <div className="font-medium">{t.title}</div>}
                  <div className="text-sm">{t.message}</div>
                </div>
                <button
                  onClick={() => clearOne(t.id)}
                  className="ml-2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}
