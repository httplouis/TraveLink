"use client";
import React from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  kind?: "success" | "error" | "info";
  ms?: number;
};

type Ctx = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx.toast;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const ms = t.ms ?? 4000;
    const next: Toast = { id, kind: "info", ...t };
    setToasts((prev) => [next, ...prev]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, ms);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* container */}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[360px] max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-md border p-3 shadow ${
              t.kind === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : t.kind === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-neutral-200 bg-white text-neutral-900"
            }`}
          >
            {t.title && <div className="mb-1 text-sm font-medium">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
