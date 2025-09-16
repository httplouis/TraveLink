"use client";

import * as React from "react";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  sub?: string;
  leftIcon?: React.ReactNode;
};

export default function Toggle({ checked, onChange, label, sub, leftIcon }: Props) {
  return (
    <label className="flex items-start gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 min-w-[44px]">
        {leftIcon}
        <input
          type="checkbox"
          className="accent-[#7A0010]"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      <div className="pt-0.5">
        <div className="text-sm text-neutral-800">{label}</div>
        {sub && <div className="text-xs text-neutral-500">{sub}</div>}
      </div>
    </label>
  );
}