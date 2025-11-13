// src/components/common/ui/ToastProvider.ui.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, X, RotateCcw } from "lucide-react";

type Toast = {
  id: string;
  kind?: "success" | "error" | "info" | "warning";
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
    const toast: Toast = { id, timeoutMs: 4000, kind: "info", ...t };
    setToasts((list) => [...list, toast]);
    const ms = toast.timeoutMs!;
    const timer = setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
    }, ms);
    return () => clearTimeout(timer);
  }, []);

  const clearOne = (id: string) => setToasts((l) => l.filter((x) => x.id !== id));

  // Don't render anything on the server — avoids hydration mismatch.
  if (!mounted) return <>{children}</>;

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div
          className="fixed right-4 z-[1000] flex w-[min(420px,90vw)] flex-col gap-3 pointer-events-none"
          style={{ top: `calc(var(--topbar-h, 64px) + 16px)` }}
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onRemove={clearOne} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = getToastConfig(toast.kind || "info");

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      className="pointer-events-auto"
    >
      <div
        className={`
          relative flex items-start gap-4 rounded-xl border-2 px-5 py-4 shadow-xl
          backdrop-blur-sm transition-all hover:shadow-2xl
          ${config.containerClass}
        `}
        role="status"
        aria-live="polite"
      >
        {/* Icon Circle */}
        <div className={`flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center ${config.iconBgClass} shadow-sm`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <h4 className={`font-bold text-sm mb-1 ${config.titleClass}`}>
              {toast.title}
            </h4>
          )}
          <p className={`text-sm leading-relaxed ${config.messageClass}`}>
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className={`
            flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg 
            transition-all hover:scale-110 active:scale-95
            ${config.closeButtonClass}
          `}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Progress Bar (optional - shows time remaining) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 rounded-b-xl overflow-hidden">
          <motion.div
            className={`h-full ${config.progressBarClass}`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: (toast.timeoutMs || 4000) / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function getToastConfig(kind: "success" | "error" | "info" | "warning") {
  switch (kind) {
    case "success":
      return {
        containerClass: "border-green-300/50 bg-gradient-to-br from-green-50 to-green-100/50",
        iconBgClass: "bg-gradient-to-br from-green-500 to-green-600",
        icon: <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />,
        titleClass: "text-green-900",
        messageClass: "text-green-800",
        closeButtonClass: "text-green-600 hover:bg-green-100",
        progressBarClass: "bg-green-500",
      };
    case "error":
      return {
        containerClass: "border-red-300/50 bg-gradient-to-br from-red-50 to-red-100/50",
        iconBgClass: "bg-gradient-to-br from-red-500 to-red-600",
        icon: <XCircle className="h-5 w-5 text-white" strokeWidth={2.5} />,
        titleClass: "text-red-900",
        messageClass: "text-red-800",
        closeButtonClass: "text-red-600 hover:bg-red-100",
        progressBarClass: "bg-red-500",
      };
    case "warning":
      return {
        containerClass: "border-amber-300/50 bg-gradient-to-br from-amber-50 to-amber-100/50",
        iconBgClass: "bg-gradient-to-br from-amber-500 to-amber-600",
        icon: <AlertCircle className="h-5 w-5 text-white" strokeWidth={2.5} />,
        titleClass: "text-amber-900",
        messageClass: "text-amber-800",
        closeButtonClass: "text-amber-600 hover:bg-amber-100",
        progressBarClass: "bg-amber-500",
      };
    case "info":
    default:
      return {
        containerClass: "border-blue-300/50 bg-gradient-to-br from-blue-50 to-blue-100/50",
        iconBgClass: "bg-gradient-to-br from-blue-500 to-blue-600",
        icon: <Info className="h-5 w-5 text-white" strokeWidth={2.5} />,
        titleClass: "text-blue-900",
        messageClass: "text-blue-800",
        closeButtonClass: "text-blue-600 hover:bg-blue-100",
        progressBarClass: "bg-blue-500",
      };
  }
}
