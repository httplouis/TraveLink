"use client";

import * as React from "react";
import Label from "./Label";

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
};

export default function Field({ label, value, onChange, error, ...rest }: FieldProps) {
  const hasError = !!error;
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...rest}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={[
          "h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none",
          hasError
            ? "border-rose-400 focus:ring-2 focus:ring-rose-400"
            : "border-neutral-300 focus:ring-2 focus:ring-[--brand]",
          rest.readOnly ? "bg-neutral-100 text-neutral-600" : "",
          rest.className ?? "",
        ].join(" ")}
      />
      {hasError && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
