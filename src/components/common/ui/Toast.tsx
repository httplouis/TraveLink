"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 3500 };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const success = React.useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message });
  }, [showToast]);

  const error = React.useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message });
  }, [showToast]);

  const warning = React.useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message });
  }, [showToast]);

  const info = React.useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message });
  }, [showToast]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = getToastConfig(toast.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="pointer-events-auto"
    >
      <div
        className="flex items-start gap-3 rounded-xl shadow-2xl px-5 py-4 min-w-[320px] max-w-md border-2"
        style={{
          backgroundColor: config.bg,
          borderColor: config.border,
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.iconBg }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4
            className="font-bold text-sm leading-tight mb-1"
            style={{ color: config.titleColor }}
          >
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs leading-relaxed" style={{ color: config.textColor }}>
              {toast.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: config.closeColor }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function getToastConfig(type: ToastType) {
  switch (type) {
    case "success":
      return {
        bg: "#f0fdf4", // green-50
        border: "#86efac", // green-300
        iconBg: "#d1fae5", // green-200
        icon: <CheckCircle className="h-6 w-6 text-green-600" />,
        titleColor: "#166534", // green-800
        textColor: "#15803d", // green-700
        closeColor: "#16a34a", // green-600
      };
    case "error":
      return {
        bg: "#fef2f2", // red-50
        border: "#fca5a5", // red-300
        iconBg: "#fecaca", // red-200
        icon: <XCircle className="h-6 w-6 text-red-600" />,
        titleColor: "#991b1b", // red-800
        textColor: "#b91c1c", // red-700
        closeColor: "#dc2626", // red-600
      };
    case "warning":
      return {
        bg: "#fefce8", // yellow-50
        border: "#fde047", // yellow-300
        iconBg: "#fef3c7", // yellow-100
        icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
        titleColor: "#854d0e", // yellow-800
        textColor: "#a16207", // yellow-700
        closeColor: "#ca8a04", // yellow-600
      };
    case "info":
      return {
        bg: "#eff6ff", // blue-50
        border: "#93c5fd", // blue-300
        iconBg: "#dbeafe", // blue-100
        icon: <Info className="h-6 w-6 text-blue-600" />,
        titleColor: "#1e40af", // blue-800
        textColor: "#1d4ed8", // blue-700
        closeColor: "#2563eb", // blue-600
      };
  }
}
