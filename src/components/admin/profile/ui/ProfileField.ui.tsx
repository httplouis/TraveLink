"use client";
import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function ProfileField({ label, ...rest }: Props) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
      <input
        {...rest}
        className={[
          "h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none",
          "focus:ring-2 focus:ring-[--brand] bg-white",
          rest.className ?? "",
        ].join(" ")}
      />
    </div>
  );
}
