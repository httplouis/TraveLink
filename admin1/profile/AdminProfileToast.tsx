"use client";

import { CheckCircle2 } from "lucide-react";

export default function AdminProfileToast({ show, text }: { show: boolean; text: string }) {
  return (
    <div
      className={`fixed bottom-6 right-6 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl bg-neutral-900 text-white px-4 py-3 shadow-lg">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  );
}
