"use client";

import * as React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
  isError?: boolean;
  error?: string;
};

export default function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  leftIcon,
  rightSlot,
  className,
  isError,
  error,
}: Props) {
  return (
    <label className={`grid gap-1 ${className ?? ""}`}>
      <span className="text-sm text-neutral-700">{label}</span>
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 bg-white ${isError ? "border-rose-400" : "border-neutral-300"}`}>
        {leftIcon}
        <input
          className="w-full outline-none bg-transparent text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
        />
        {rightSlot}
      </div>
      {isError && !!error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
